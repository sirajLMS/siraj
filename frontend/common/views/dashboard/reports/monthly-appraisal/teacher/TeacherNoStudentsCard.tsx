"use client";

import { Card, CardContent, Typography } from "@mui/material";

export interface TeacherNoStudentsCardProps {
  readonly message: string;
  readonly paddingY?: number;
}

export function TeacherNoStudentsCard({ message, paddingY = 6 }: Readonly<TeacherNoStudentsCardProps>) {
  return (
    <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
      <CardContent sx={{ textAlign: "center", py: paddingY }}>
        <Typography sx={theme => ({ color: theme.palette.text.secondary })}>{message}</Typography>
      </CardContent>
    </Card>
  );
}
