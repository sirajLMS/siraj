package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"syscall"
	"time"

	"golang.org/x/term"
)

const (
	defaultAPIURL     = "http://localhost:20128/v1"
	defaultModelsFile = "router_models.json"
	defaultSQLFile    = "router_performance.sql"
	defaultDBFile     = "router_performance.db"
	requestTimeout    = 60 * time.Second
	intervalBetween   = 3 * time.Minute
)

// ANSI color codes
const (
	Reset       = "\033[0m"
	Bold        = "\033[1m"
	Dim         = "\033[2m"
	Red         = "\033[31m"
	Green       = "\033[32m"
	Yellow      = "\033[33m"
	Blue        = "\033[34m"
	Magenta     = "\033[35m"
	Cyan        = "\033[36m"
	White       = "\033[37m"
	BrightGreen = "\033[92m"
	BrightCyan  = "\033[96m"
	BgRed       = "\033[41m"
)

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Model     string        `json:"model"`
	Messages  []ChatMessage `json:"messages"`
	MaxTokens int           `json:"max_tokens"`
}

type ModelConfig struct {
	Model          string  `json:"model"`
	Enabled        *bool   `json:"enabled,omitempty"`
	AlertEnabled   bool    `json:"alert_enabled"`
	AlertTargetMax float64 `json:"alert_target_max"`
	AlertPrevMin   float64 `json:"alert_prev_min"`
}

func (c *ModelConfig) IsEnabled() bool {
	if c.Enabled == nil {
		return true
	}
	return *c.Enabled
}

type RatingInfo struct {
	Rank  int
	Name  string
	Emoji string
	Color string
}

var cubeFrames = []string{"▖", "▘", "▝", "▗"}

func getRatingInfo(d time.Duration, err error) RatingInfo {
	if err != nil || d >= requestTimeout {
		return RatingInfo{Rank: 8, Name: "VERY BAD", Emoji: "💀", Color: BgRed + White + Bold}
	}
	secs := d.Seconds()
	switch {
	case secs < 2:
		return RatingInfo{Rank: 1, Name: "ULTRA FAST", Emoji: "⚡", Color: BrightCyan + Bold}
	case secs < 5:
		return RatingInfo{Rank: 2, Name: "EXCELLENT", Emoji: "🌟", Color: BrightGreen + Bold}
	case secs < 10:
		return RatingInfo{Rank: 3, Name: "FAST", Emoji: "🚀", Color: Green + Bold}
	case secs < 20:
		return RatingInfo{Rank: 4, Name: "GOOD", Emoji: "👍", Color: Yellow + Bold}
	case secs < 30:
		return RatingInfo{Rank: 5, Name: "MEDIUM", Emoji: "😐", Color: Yellow}
	case secs < 50:
		return RatingInfo{Rank: 6, Name: "LOW", Emoji: "🐢", Color: Magenta}
	case secs < 60:
		return RatingInfo{Rank: 7, Name: "BAD", Emoji: "⚠️", Color: Red + Bold}
	default:
		return RatingInfo{Rank: 8, Name: "VERY BAD", Emoji: "💀", Color: BgRed + White + Bold}
	}
}

func ratingFromName(name string) RatingInfo {
	switch strings.ToUpper(strings.TrimSpace(name)) {
	case "ULTRA FAST":
		return RatingInfo{Rank: 1, Name: "ULTRA FAST", Emoji: "⚡", Color: BrightCyan + Bold}
	case "EXCELLENT":
		return RatingInfo{Rank: 2, Name: "EXCELLENT", Emoji: "🌟", Color: BrightGreen + Bold}
	case "FAST":
		return RatingInfo{Rank: 3, Name: "FAST", Emoji: "🚀", Color: Green + Bold}
	case "GOOD":
		return RatingInfo{Rank: 4, Name: "GOOD", Emoji: "👍", Color: Yellow + Bold}
	case "MEDIUM":
		return RatingInfo{Rank: 5, Name: "MEDIUM", Emoji: "😐", Color: Yellow}
	case "LOW":
		return RatingInfo{Rank: 6, Name: "LOW", Emoji: "🐢", Color: Magenta}
	case "BAD":
		return RatingInfo{Rank: 7, Name: "BAD", Emoji: "⚠️", Color: Red + Bold}
	case "VERY BAD":
		return RatingInfo{Rank: 8, Name: "VERY BAD", Emoji: "💀", Color: BgRed + White + Bold}
	case "DISABLED":
		return RatingInfo{Rank: 10, Name: "DISABLED", Emoji: "⏸️", Color: Dim}
	default:
		return RatingInfo{Rank: 9, Name: "UNKNOWN", Emoji: "❓", Color: Dim}
	}
}

func sendDesktopNotification(title, msg string) {
	cmd := exec.Command("notify-send", "-u", "critical", "-i", "speedometer", title, msg)
	_ = cmd.Run()
}

// fitWidth ensures string s occupies EXACTLY targetWidth visual columns on terminal,
// truncating with "..." if s is too wide (overflow hidden), or padding spaces if too narrow.
func fitWidth(s string, targetWidth int) string {
	if targetWidth <= 0 {
		return ""
	}

	type charInfo struct {
		runeStr string
		width   int
	}

	var chars []charInfo
	runes := []rune(s)
	inEscape := false
	var currentEscape strings.Builder

	for i := 0; i < len(runes); i++ {
		r := runes[i]
		if r == '\033' {
			inEscape = true
			currentEscape.WriteRune(r)
			continue
		}
		if inEscape {
			currentEscape.WriteRune(r)
			if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || r == 'm' {
				inEscape = false
			}
			continue
		}

		if r >= 0xFE00 && r <= 0xFE0F {
			if len(chars) > 0 {
				chars[len(chars)-1].runeStr += string(r)
			}
			continue
		}

		w := 1
		if r >= 0x1F000 || r == 0x26A0 || r == 0x26A1 || r == 0x2705 || r == 0x274C || r == 0x23F3 || r == 0x23F8 || r == 0x1F504 || r == 0x1F44D || r == 0x2753 || r == 0x1F514 {
			w = 2
		}

		chars = append(chars, charInfo{
			runeStr: string(r),
			width:   w,
		})
	}

	currentWidth := 0
	for _, c := range chars {
		currentWidth += c.width
	}

	if currentWidth == targetWidth {
		return s
	}

	if currentWidth < targetWidth {
		return s + strings.Repeat(" ", targetWidth-currentWidth)
	}

	dots := "..."
	dotsWidth := 3
	if targetWidth <= 3 {
		dots = ""
		dotsWidth = 0
	}

	allowedWidth := targetWidth - dotsWidth
	var sb strings.Builder
	accumulated := 0

	for _, c := range chars {
		if accumulated+c.width > allowedWidth {
			break
		}
		sb.WriteString(c.runeStr)
		accumulated += c.width
	}

	if dotsWidth > 0 {
		sb.WriteString(dots)
		accumulated += dotsWidth
	}

	if accumulated < targetWidth {
		sb.WriteString(strings.Repeat(" ", targetWidth-accumulated))
	}

	return sb.String()
}

func sqlEscape(s string) string {
	return strings.ReplaceAll(s, "'", "''")
}

type LastModelRecord struct {
	Model    string
	Latency  time.Duration
	Rating   string
	ErrorMsg string
	Time     time.Time
}

type SQLLogger struct {
	mu       sync.Mutex
	filePath string
	dbPath   string
}

func NewSQLLogger(sqlPath, dbPath string) *SQLLogger {
	l := &SQLLogger{
		filePath: sqlPath,
		dbPath:   dbPath,
	}
	l.init()
	return l
}

func (l *SQLLogger) init() {
	l.mu.Lock()
	defer l.mu.Unlock()

	if _, err := os.Stat(l.filePath); os.IsNotExist(err) {
		header := "-- Router Model Performance Log\n" +
			"CREATE TABLE IF NOT EXISTS model_performance (\n" +
			"    id INTEGER PRIMARY KEY AUTOINCREMENT,\n" +
			"    timestamp DATETIME NOT NULL,\n" +
			"    model TEXT NOT NULL,\n" +
			"    latency_seconds REAL NOT NULL,\n" +
			"    rating TEXT NOT NULL,\n" +
			"    success INTEGER NOT NULL,\n" +
			"    error_message TEXT\n" +
			");\n\n"
		_ = os.WriteFile(l.filePath, []byte(header), 0644)
	}

	if l.dbPath != "" {
		schema := "CREATE TABLE IF NOT EXISTS model_performance (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp DATETIME NOT NULL, model TEXT NOT NULL, latency_seconds REAL NOT NULL, rating TEXT NOT NULL, success INTEGER NOT NULL, error_message TEXT);"
		cmd := exec.Command("sqlite3", l.dbPath, schema)
		_ = cmd.Run()
	}
}

func (l *SQLLogger) LoadLastStatuses() map[string]LastModelRecord {
	l.mu.Lock()
	defer l.mu.Unlock()

	res := make(map[string]LastModelRecord)
	if l.dbPath == "" {
		return res
	}

	query := "SELECT model, latency_seconds, rating, error_message, timestamp FROM model_performance m1 WHERE timestamp = (SELECT MAX(timestamp) FROM model_performance m2 WHERE m2.model = m1.model);"
	cmd := exec.Command("sqlite3", "-json", l.dbPath, query)
	out, err := cmd.Output()
	if err != nil || len(out) == 0 {
		return res
	}

	type jsonRec struct {
		Model          string  `json:"model"`
		LatencySeconds float64 `json:"latency_seconds"`
		Rating         string  `json:"rating"`
		ErrorMessage   string  `json:"error_message"`
		Timestamp      string  `json:"timestamp"`
	}

	var recs []jsonRec
	if json.Unmarshal(out, &recs) == nil {
		for _, r := range recs {
			t, _ := time.Parse("2006-01-02 15:04:05", r.Timestamp)
			res[r.Model] = LastModelRecord{
				Model:    r.Model,
				Latency:  time.Duration(r.LatencySeconds * float64(time.Second)),
				Rating:   r.Rating,
				ErrorMsg: r.ErrorMessage,
				Time:     t,
			}
		}
	}
	return res
}

func (l *SQLLogger) Log(timestamp time.Time, model string, latency time.Duration, rating string, err error) {
	l.mu.Lock()
	defer l.mu.Unlock()

	timeStr := timestamp.Format("2006-01-02 15:04:05")
	success := 1
	errMsg := ""
	if err != nil {
		success = 0
		errMsg = err.Error()
	}

	stmt := fmt.Sprintf(
		"INSERT INTO model_performance (timestamp, model, latency_seconds, rating, success, error_message) VALUES ('%s', '%s', %.3f, '%s', %d, '%s');\n",
		timeStr,
		sqlEscape(model),
		latency.Seconds(),
		sqlEscape(rating),
		success,
		sqlEscape(errMsg),
	)

	f, errFile := os.OpenFile(l.filePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if errFile == nil {
		_, _ = f.WriteString(stmt)
		_ = f.Close()
	}

	if l.dbPath != "" {
		cmd := exec.Command("sqlite3", l.dbPath, stmt)
		_ = cmd.Run()
	}
}

type ModelStatus struct {
	Model          string
	Enabled        bool
	State          string // "DONE", "PINGING", "DISABLED"
	PingStartTime  time.Time
	LastPing       time.Duration
	LastRating     RatingInfo
	LastError      error
	LastCheck      time.Time
	NextCheck      time.Time
	AlertEnabled   bool
	AlertTargetMax float64
	AlertPrevMin   float64
	LastAlertTime  time.Time
	LastAlertMsg   string
}

func (st *ModelStatus) GetRank() int {
	if !st.Enabled {
		return 10
	}
	return st.LastRating.Rank
}

type MonitorApp struct {
	mu           sync.Mutex
	apiURL       string
	models       []ModelConfig
	statuses     map[string]*ModelStatus
	client       *http.Client
	triggerChans map[string]chan struct{}
	sqlLogger    *SQLLogger
	animFrame    int
}

func NewMonitorApp(apiURL string, configs []ModelConfig, sqlLogger *SQLLogger) *MonitorApp {
	app := &MonitorApp{
		apiURL:       apiURL,
		models:       configs,
		statuses:     make(map[string]*ModelStatus),
		client:       &http.Client{Timeout: requestTimeout},
		triggerChans: make(map[string]chan struct{}),
		sqlLogger:    sqlLogger,
	}

	lastRecords := make(map[string]LastModelRecord)
	if sqlLogger != nil {
		lastRecords = sqlLogger.LoadLastStatuses()
	}

	for _, cfg := range configs {
		m := cfg.Model
		enabled := cfg.IsEnabled()

		targetMax := cfg.AlertTargetMax
		if targetMax <= 0 {
			targetMax = 10.0
		}
		prevMin := cfg.AlertPrevMin
		if prevMin <= 0 {
			prevMin = 30.0
		}

		st := &ModelStatus{
			Model:          m,
			Enabled:        enabled,
			State:          "DONE",
			LastRating:     RatingInfo{Rank: 9, Name: "UNKNOWN", Emoji: "❓", Color: Dim},
			AlertEnabled:   cfg.AlertEnabled,
			AlertTargetMax: targetMax,
			AlertPrevMin:   prevMin,
		}

		if !enabled {
			st.State = "DISABLED"
			st.LastRating = RatingInfo{Rank: 10, Name: "DISABLED", Emoji: "⏸️", Color: Dim}
		} else if rec, exists := lastRecords[m]; exists {
			st.LastPing = rec.Latency
			st.LastRating = ratingFromName(rec.Rating)
			st.LastCheck = rec.Time
			st.NextCheck = time.Now()
			if rec.ErrorMsg != "" {
				st.LastError = errors.New(rec.ErrorMsg)
			}
		}

		app.statuses[m] = st
		app.triggerChans[m] = make(chan struct{}, 1)
	}

	return app
}

func resolvePath(relPath string) string {
	if filepath.IsAbs(relPath) {
		if _, err := os.Stat(relPath); err == nil {
			return relPath
		}
	}
	if cwd, err := os.Getwd(); err == nil {
		path := filepath.Join(cwd, relPath)
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}
	if execPath, err := os.Executable(); err == nil {
		dir := filepath.Dir(execPath)
		path := filepath.Join(dir, relPath)
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}
	projectFallback := filepath.Join("/home/ahmed/Projects/router/nvidia", relPath)
	if _, err := os.Stat(projectFallback); err == nil {
		return projectFallback
	}
	return relPath
}

func readModelsConfig(filePath string) ([]ModelConfig, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	var cfgs []ModelConfig
	if errJSON := json.Unmarshal(data, &cfgs); errJSON == nil && len(cfgs) > 0 && cfgs[0].Model != "" {
		return cfgs, nil
	}

	var strList []string
	if errJSON := json.Unmarshal(data, &strList); errJSON == nil && len(strList) > 0 {
		for _, s := range strList {
			cfgs = append(cfgs, ModelConfig{Model: s})
		}
		return cfgs, nil
	}

	lines := strings.Split(string(data), "\n")
	seen := make(map[string]bool)
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		if !seen[line] {
			seen[line] = true
			cfgs = append(cfgs, ModelConfig{Model: line})
		}
	}

	return cfgs, nil
}

func pingModel(client *http.Client, apiBaseURL, model string) (time.Duration, error) {
	reqURL := fmt.Sprintf("%s/chat/completions", strings.TrimRight(apiBaseURL, "/"))

	payload := ChatRequest{
		Model: model,
		Messages: []ChatMessage{
			{Role: "user", Content: "ping"},
		},
		MaxTokens: 1,
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return 0, fmt.Errorf("failed to marshal payload: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), requestTimeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return 0, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	start := time.Now()
	resp, err := client.Do(req)
	duration := time.Since(start)

	if err != nil {
		return duration, err
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)

	if resp.StatusCode != http.StatusOK {
		return duration, fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	return duration, nil
}

func (app *MonitorApp) runWorker(ctx context.Context, cfg ModelConfig, wg *sync.WaitGroup, isDashboard bool) {
	defer wg.Done()

	model := cfg.Model
	if !cfg.IsEnabled() {
		app.mu.Lock()
		st := app.statuses[model]
		st.State = "DISABLED"
		st.LastRating = RatingInfo{Rank: 10, Name: "DISABLED", Emoji: "⏸️", Color: Dim}
		app.mu.Unlock()
		return
	}

	trigger := app.triggerChans[model]

	for {
		nowStart := time.Now()
		app.mu.Lock()
		st := app.statuses[model]

		prevSecs := st.LastPing.Seconds()
		if st.LastError != nil || st.LastCheck.IsZero() {
			prevSecs = 60.0
		}

		st.State = "PINGING"
		st.PingStartTime = nowStart
		app.mu.Unlock()

		if !isDashboard {
			fmt.Printf("%s[%s]%s 🔄 Pinging │ %s%s%s...\n",
				Dim, nowStart.Format("15:04:05"), Reset, Cyan, model, Reset)
		}

		duration, err := pingModel(app.client, app.apiURL, model)
		rating := getRatingInfo(duration, err)
		nowEnd := time.Now()
		newSecs := duration.Seconds()

		app.mu.Lock()
		st.State = "DONE"
		st.LastPing = duration
		st.LastRating = rating
		st.LastError = err
		st.LastCheck = nowEnd
		st.NextCheck = nowEnd.Add(intervalBetween)

		if st.AlertEnabled && err == nil {
			targetMax := st.AlertTargetMax
			if targetMax <= 0 {
				targetMax = 10.0
			}
			prevMin := st.AlertPrevMin
			if prevMin <= 0 {
				prevMin = 30.0
			}

			if prevSecs > prevMin && newSecs <= targetMax {
				alertTitle := "🚀 Model Recovery Alert!"
				alertMsg := fmt.Sprintf("%s latency dropped from %.1fs to %.2fs!", model, prevSecs, newSecs)

				sendDesktopNotification(alertTitle, alertMsg)

				st.LastAlertTime = nowEnd
				st.LastAlertMsg = alertMsg
			}
		}
		app.mu.Unlock()

		if app.sqlLogger != nil {
			app.sqlLogger.Log(nowEnd, model, duration, rating.Name, err)
		}

		if !isDashboard {
			nowStr := nowEnd.Format("15:04:05")
			badge := fitWidth(fmt.Sprintf("%s%s %s%s", rating.Color, rating.Emoji, rating.Name, Reset), 14)
			if err != nil {
				fmt.Printf("%s[%s]%s %s │ %s%6.2fs%s │ %s%-32s%s │ %sError: %v%s\n",
					Dim, nowStr, Reset,
					badge,
					Red, duration.Seconds(), Reset,
					Bold, fitWidth(model, 32), Reset,
					Red, err, Reset)
			} else {
				fmt.Printf("%s[%s]%s %s │ %s%6.2fs%s │ %s%-32s%s\n",
					Dim, nowStr, Reset,
					badge,
					BrightGreen, duration.Seconds(), Reset,
					Bold, fitWidth(model, 32), Reset)
			}
		}

		select {
		case <-ctx.Done():
			return
		case <-trigger:
		case <-time.After(intervalBetween):
		}
	}
}

func (app *MonitorApp) renderDashboard() {
	app.mu.Lock()
	defer app.mu.Unlock()

	app.animFrame = (app.animFrame + 1) % len(cubeFrames)
	currentCube := cubeFrames[app.animFrame]

	termWidth := 80
	if tw, _, err := term.GetSize(int(os.Stdout.Fd())); err == nil && tw > 30 {
		termWidth = tw
	}

	sortedStatuses := make([]*ModelStatus, 0, len(app.models))
	for _, cfg := range app.models {
		sortedStatuses = append(sortedStatuses, app.statuses[cfg.Model])
	}

	sort.Slice(sortedStatuses, func(i, j int) bool {
		rI, rJ := sortedStatuses[i].GetRank(), sortedStatuses[j].GetRank()
		if rI != rJ {
			return rI < rJ
		}
		if sortedStatuses[i].LastPing != sortedStatuses[j].LastPing {
			return sortedStatuses[i].LastPing < sortedStatuses[j].LastPing
		}
		return sortedStatuses[i].Model < sortedStatuses[j].Model
	})

	var sb strings.Builder
	sb.WriteString("\033[H\033[J")

	nowStr := time.Now().Format("15:04:05")
	headerTitle := fmt.Sprintf("⚡ ROUTER MODEL MONITOR  [%s]", nowStr)

	separator := strings.Repeat("─", termWidth)

	sb.WriteString(BrightCyan + Bold + headerTitle + Reset + "\r\n")
	sb.WriteString(Dim + app.apiURL + Reset + "\r\n")
	sb.WriteString(Cyan + separator + Reset + "\r\n")

	for idx, st := range sortedStatuses {
		m := st.Model

		var icon string
		if st.State == "PINGING" {
			icon = Yellow + Bold + currentCube + Reset
		} else {
			icon = st.LastRating.Emoji
		}
		col1Raw := fmt.Sprintf("%2d. %s", idx+1, icon)
		col1Cell := fitWidth(col1Raw, 7)

		col2Raw := st.LastRating.Color + st.LastRating.Name + Reset
		col2Cell := fitWidth(col2Raw, 10)

		var latencyRaw string
		if st.State == "DISABLED" {
			latencyRaw = Dim + "  --   " + Reset
		} else if !st.LastCheck.IsZero() {
			if st.LastError != nil && st.LastPing >= requestTimeout {
				latencyRaw = Red + "60.0s" + Reset
			} else {
				latencyRaw = fmt.Sprintf("%5.2fs", st.LastPing.Seconds())
			}
		} else {
			latencyRaw = Dim + "  --   " + Reset
		}
		col3Cell := fitWidth(latencyRaw, 7)

		var timerRaw string
		if st.State == "DISABLED" {
			timerRaw = Dim + "Disabled " + Reset
		} else if st.State == "PINGING" {
			elapsed := time.Since(st.PingStartTime)
			timerRaw = Yellow + fmt.Sprintf("%5.1fs ", elapsed.Seconds()) + Reset
		} else if !st.NextCheck.IsZero() {
			rem := time.Until(st.NextCheck)
			if rem <= 0 {
				timerRaw = BrightGreen + "Due now " + Reset
			} else {
				mins := int(rem.Minutes())
				secs := int(rem.Seconds()) % 60
				timerRaw = fmt.Sprintf("in %02dm%02ds", mins, secs)
			}
		} else {
			timerRaw = Dim + "   --    " + Reset
		}
		col4Cell := fitWidth(timerRaw, 10)

		availModelWidth := termWidth - 46
		if availModelWidth < 10 {
			availModelWidth = 10
		}
		col5Cell := fitWidth(Bold+m+Reset, availModelWidth)

		sb.WriteString(fmt.Sprintf("%s │ %s │ %s │ %s │ %s\r\n",
			col1Cell,
			col2Cell,
			col3Cell,
			col4Cell,
			col5Cell))

		if st.LastError != nil && st.State != "PINGING" && st.State != "DISABLED" {
			errStr := fmt.Sprintf("    └─ Error: %v", st.LastError)
			sb.WriteString(Red + fitWidth(errStr, termWidth-1) + Reset + "\r\n")
		}

		if !st.LastAlertTime.IsZero() && time.Since(st.LastAlertTime) < 5*time.Minute {
			alertLine := fmt.Sprintf("    🔔 ALERT: %s", st.LastAlertMsg)
			sb.WriteString(BrightGreen + Bold + fitWidth(alertLine, termWidth-1) + Reset + "\r\n")
		}
	}

	sb.WriteString(Cyan + separator + Reset + "\r\n")
	controls := "Controls: [r] Refresh  │  [q] Quit"
	sb.WriteString(Bold + fitWidth(controls, termWidth) + Reset + "\r\n")

	fmt.Print(sb.String())
}

func (app *MonitorApp) TriggerAll() {
	app.mu.Lock()
	defer app.mu.Unlock()
	for _, ch := range app.triggerChans {
		select {
		case ch <- struct{}{}:
		default:
		}
	}
}

func main() {
	apiURLFlag := flag.String("api", defaultAPIURL, "Router base API URL")
	modelsFileFlag := flag.String("file", defaultModelsFile, "Path to models file (JSON or TXT)")
	sqlFileFlag := flag.String("sql", defaultSQLFile, "Path to SQL log file")
	dbFileFlag := flag.String("db", defaultDBFile, "Path to SQLite database file")
	onceFlag := flag.Bool("once", false, "Run single check pass for all models and exit")
	streamFlag := flag.Bool("stream", false, "Run in scrolling log mode instead of live dashboard")
	flag.Parse()

	modelsPath := resolvePath(*modelsFileFlag)
	if _, err := os.Stat(modelsPath); os.IsNotExist(err) && *modelsFileFlag == defaultModelsFile {
		modelsPath = resolvePath("router_models.txt")
	}

	configs, err := readModelsConfig(modelsPath)
	if err != nil {
		fmt.Printf("%sError reading models file (%s): %v%s\r\n", Red, modelsPath, err, Reset)
		os.Exit(1)
	}

	if len(configs) == 0 {
		fmt.Printf("%sNo models found in %s%s\r\n", Red, modelsPath, err, Reset)
		os.Exit(1)
	}

	sqlPath := resolvePath(*sqlFileFlag)
	dbPath := resolvePath(*dbFileFlag)
	sqlLogger := NewSQLLogger(sqlPath, dbPath)

	app := NewMonitorApp(*apiURLFlag, configs, sqlLogger)
	isDashboard := term.IsTerminal(int(os.Stdout.Fd())) && !*onceFlag && !*streamFlag

	if *onceFlag {
		fmt.Println(BrightCyan + Bold + "⚡ ROUTER MODEL MONITOR (SINGLE PASS)" + Reset)
		fmt.Println(Dim + "API: " + *apiURLFlag + Reset)
		fmt.Println(Cyan + "────────────────────────────────────────────────────────────────────────────" + Reset)

		var wg sync.WaitGroup
		for _, cfg := range configs {
			if !cfg.IsEnabled() {
				continue
			}
			wg.Add(1)
			go func(model string) {
				defer wg.Done()
				duration, err := pingModel(app.client, *apiURLFlag, model)
				rating := getRatingInfo(duration, err)
				now := time.Now()
				nowStr := now.Format("15:04:05")

				sqlLogger.Log(now, model, duration, rating.Name, err)

				badge := fitWidth(fmt.Sprintf("%s%s %s%s", rating.Color, rating.Emoji, rating.Name, Reset), 14)

				if err != nil {
					fmt.Printf("%s[%s]%s %s │ %s%6.2fs%s │ %s%-32s%s │ %sError: %v%s\n",
						Dim, nowStr, Reset,
						badge,
						Red, duration.Seconds(), Reset,
						Bold, fitWidth(model, 32), Reset,
						Red, err, Reset)
				} else {
					fmt.Printf("%s[%s]%s %s │ %s%6.2fs%s │ %s%-32s%s\n",
						Dim, nowStr, Reset,
						badge,
						BrightGreen, duration.Seconds(), Reset,
						Bold, fitWidth(model, 32), Reset)
				}
			}(cfg.Model)
		}
		wg.Wait()
		fmt.Println(Cyan + "────────────────────────────────────────────────────────────────────────────" + Reset)
		return
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	var wg sync.WaitGroup
	for _, cfg := range configs {
		wg.Add(1)
		go app.runWorker(ctx, cfg, &wg, isDashboard)
	}

	if isDashboard {
		fmt.Print("\033[2J")

		oldState, err := term.MakeRaw(int(os.Stdin.Fd()))
		if err == nil {
			defer term.Restore(int(os.Stdin.Fd()), oldState)
		}

		keyChan := make(chan byte, 1)
		go func() {
			buf := make([]byte, 1)
			for {
				n, err := os.Stdin.Read(buf)
				if err != nil || n == 0 {
					return
				}
				keyChan <- buf[0]
			}
		}()

		ticker := time.NewTicker(200 * time.Millisecond)
		defer ticker.Stop()

		for {
			select {
			case <-sigChan:
				cancel()
				wg.Wait()
				return
			case key := <-keyChan:
				if key == 'q' || key == 'Q' || key == 3 {
					cancel()
					wg.Wait()
					return
				} else if key == 'r' || key == 'R' {
					app.TriggerAll()
				}
			case <-ticker.C:
				app.renderDashboard()
			}
		}
	} else {
		fmt.Println("Running in log stream mode. Press Ctrl+C to stop.")
		<-sigChan
		fmt.Println("\nStopping workers...")
		cancel()
		wg.Wait()
		fmt.Println("Monitor stopped.")
	}
}
