// Probe layout rects for the student credits list page.
function rectOf(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
}

// SectionPanel structure: Paper > [header Box?, content Box]
const grid = document.querySelector(".MuiDataGrid-root");
const paper = grid ? grid.closest(".MuiPaper-root") : null;
const contentBox = grid ? grid.parentElement : null; // Box wrapper from AppDataGridChrome
const stack = contentBox ? contentBox.parentElement : null;
const panelContent = stack && stack.parentElement === paper ? stack.parentElement : null;

// header box = first child of paper
const headerBox = paper ? paper.firstElementChild : null;

const actionsHeader = document.querySelector(".MuiDataGrid-columnHeader[data-field='actions']");
const classesHeader = document.querySelector(".MuiDataGrid-columnHeader[data-field='classesRemaining']");
const nameHeader = document.querySelector(".MuiDataGrid-columnHeader[data-field='name']");
const teacherHeader = document.querySelector(".MuiDataGrid-columnHeader[data-field='teacherName']");

const firstRow = document.querySelector(".MuiDataGrid-row");
let actionButton = null;
if (firstRow) {
  actionButton = firstRow.querySelector("[data-field='actions'] button");
}

const headerTitle = actionsHeader ? actionsHeader.querySelector(".MuiDataGrid-columnHeaderTitle") : null;

// overflow / horizontal scroll
const scroller = document.querySelector(".MuiDataGrid-virtualScroller");

return {
  viewport: { w: window.innerWidth, h: window.innerHeight },
  headerBox: rectOf(headerBox),
  contentBox: rectOf(panelContent),
  grid: rectOf(grid),
  gap_headerBottom_to_gridTop: rectOf(grid) && rectOf(headerBox) ? Math.round(rectOf(grid).y - (rectOf(headerBox).y + rectOf(headerBox).h)) : null,
  cols: {
    name: rectOf(nameHeader),
    teacherName: rectOf(teacherHeader),
    classesRemaining: rectOf(classesHeader),
    actions: rectOf(actionsHeader),
  },
  actionsHeaderTitleText: headerTitle ? { text: headerTitle.textContent, rect: rectOf(headerTitle) } : null,
  actionsCellButton: rectOf(actionButton),
  scrollerOverflowX: scroller ? { clientWidth: scroller.clientWidth, scrollWidth: scroller.scrollWidth, overflowX: getComputedStyle(scroller).overflowX } : null,
  classesHeaderText: classesHeader ? classesHeader.textContent : null,
};
