"use client";

import { DescriptionOutlined, EmailOutlined, RateReviewOutlined } from "@mui/icons-material";
import { styled } from "@mui/material/styles";

export const StyledFormHeaderIcon = styled(RateReviewOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

export const StyledEmailIcon = styled(EmailOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

export const StyledDescriptionIcon = styled(DescriptionOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));
