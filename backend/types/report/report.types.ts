export interface StudentMonthlyReportReturnType {
  readonly studentId: string;
  readonly studentName: string;
  readonly year: number;
  readonly month: number;
  readonly totalLessons: number;
  readonly completedLessons: number;
  readonly cancelledLessons: number;
  readonly presentCount: number;
  readonly absentCount: number;
  readonly lateCount: number;
  readonly totalHours: number;
  readonly creditsPurchased: number;
  readonly creditsDeducted: number;
  readonly creditsRefunded: number;
  readonly creditsBalance: number;
}

export interface StudentHeader {
  readonly studentId: string;
  readonly studentName: string;
  readonly classesRemaining: number;
}
