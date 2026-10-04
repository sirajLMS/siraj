"use client";

import { useState } from "react";

interface LiveSessionToolbarDialogCallbacks {
  readonly onAbsent: () => void;
  readonly onLeave: (reason: string) => void;
  readonly onReset: () => void;
}

export interface LiveSessionToolbarDialogs {
  readonly leaveDialogOpen: boolean;
  readonly leaveReason: string;
  readonly setLeaveReason: (reason: string) => void;
  readonly absentDialogOpen: boolean;
  readonly resetDialogOpen: boolean;
  readonly handleLeaveClick: () => void;
  readonly handleLeaveClose: () => void;
  readonly handleLeaveSubmit: () => void;
  readonly handleAbsentClick: () => void;
  readonly handleAbsentClose: () => void;
  readonly handleAbsentSubmit: () => void;
  readonly handleResetClick: () => void;
  readonly handleResetClose: () => void;
  readonly handleResetSubmit: () => void;
}

export function useLiveSessionToolbarDialogs({
  onAbsent,
  onLeave,
  onReset,
}: LiveSessionToolbarDialogCallbacks): LiveSessionToolbarDialogs {
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");
  const [absentDialogOpen, setAbsentDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleLeaveClick = () => {
    setLeaveReason("");
    setLeaveDialogOpen(true);
  };

  const handleLeaveClose = () => {
    setLeaveDialogOpen(false);
  };

  const handleLeaveSubmit = () => {
    if (leaveReason.trim()) {
      onLeave(leaveReason.trim());
      setLeaveDialogOpen(false);
    }
  };

  const handleAbsentClick = () => {
    setAbsentDialogOpen(true);
  };

  const handleAbsentClose = () => {
    setAbsentDialogOpen(false);
  };

  const handleAbsentSubmit = () => {
    onAbsent();
    setAbsentDialogOpen(false);
  };

  const handleResetClick = () => {
    setResetDialogOpen(true);
  };

  const handleResetClose = () => {
    setResetDialogOpen(false);
  };

  const handleResetSubmit = () => {
    onReset();
    setResetDialogOpen(false);
  };

  return {
    leaveDialogOpen,
    leaveReason,
    setLeaveReason,
    absentDialogOpen,
    resetDialogOpen,
    handleLeaveClick,
    handleLeaveClose,
    handleLeaveSubmit,
    handleAbsentClick,
    handleAbsentClose,
    handleAbsentSubmit,
    handleResetClick,
    handleResetClose,
    handleResetSubmit,
  };
}
