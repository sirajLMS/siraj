"use client";

import {
  CalendarMonthOutlined,
  ChatBubbleOutlineOutlined,
  CreditCardOutlined,
  SchoolOutlined,
} from "@mui/icons-material";
import { Button, Card, CardContent, Stack } from "@mui/material";
import type { ReactElement } from "react";

interface QuickActionItem {
  readonly label: string;
  readonly href: string;
  readonly icon: ReactElement;
  readonly color: "primary" | "secondary" | "success" | "info" | "warning";
}

interface QuickActionStripProps {
  readonly labels: {
    readonly complaints: string;
    readonly payments: string;
    readonly calendar: string;
    readonly appraisals: string;
  };
}

function QuickActionButton({ item }: Readonly<{ item: QuickActionItem }>) {
  return (
    <Button
      variant="outlined"
      fullWidth
      href={item.href}
      startIcon={item.icon}
      color={item.color}
      sx={{
        borderRadius: 2,
        textTransform: "none",
        fontWeight: 600,
        py: 1.5,
        justifyContent: "flex-start",
        borderColor: theme => theme.palette.divider,
        "&:hover": { borderWidth: 2 },
      }}
    >
      {item.label}
    </Button>
  );
}

export function QuickActionStrip({ labels }: Readonly<QuickActionStripProps>) {
  const actions: readonly QuickActionItem[] = [
    { label: labels.complaints, href: "/complaints", icon: <ChatBubbleOutlineOutlined />, color: "primary" },
    { label: labels.payments, href: "/parent/payments", icon: <CreditCardOutlined />, color: "success" },
    { label: labels.calendar, href: "/student/week-schedule", icon: <CalendarMonthOutlined />, color: "info" },
    { label: labels.appraisals, href: "/student/monthly-appraisals", icon: <SchoolOutlined />, color: "warning" },
  ];

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          {actions.map(action => (
            <QuickActionButton key={action.href} item={action} />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
