"use client";

import { Box, Paper, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface ParentQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

interface ChildTab {
  readonly id: string;
  readonly label: string;
}

export function ParentQuotaView({ t }: Readonly<ParentQuotaViewProps>) {
  const [activeTab, setActiveTab] = useState(0);

  const children: ChildTab[] = [];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="titleLg" sx={{ mb: 2 }}>
        {t.audience.parentTitle}
      </Typography>
      {children.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }} elevation={0} variant="outlined">
          <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
            {t.audience.noChildren}
          </Typography>
        </Paper>
      ) : (
        <>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
            {children.map(child => (
              <Tab key={child.id} label={child.label} />
            ))}
          </Tabs>
          {children.map((child, index) => (
            <Box key={child.id} role="tabpanel" hidden={activeTab !== index}>
              {activeTab === index && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Paper sx={{ p: 3 }} elevation={0} variant="outlined">
                    <Typography variant="labelMd" sx={{ mb: 1 }}>
                      {child.label} - {t.audience.quotaSummary}
                    </Typography>
                    <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
                      {t.audience.noData}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          ))}
        </>
      )}
    </Box>
  );
}
