"use client";

import type React from "react";
import { useMemo } from "react";
import type { ParentProfileData } from "../types/profile";
import ParentProfileView from "./ParentProfileView";

interface ParentProfileContainerProps {
  readonly id: string;
}

const MOCK_PARENT: ParentProfileData = {
  id: "par-001",
  name: "Omar Ahmed",
  avatarUrl: "/demo/avatars/01.png",
  status: "regular",
  nationality: "Egyptian",
  email: "omar@email.com",
  phone: "+20 123 456 789",
  address: "Cairo, Egypt",
  facebook: "omar.ahmed.9",
  whatsapp: "+20 123 456 789",
  skype: "omar_skype_edu",
  zoomLink: "zoom.us/j/123456789",
  invoiceType: "Per Classes",
  feeAmount: 50,
  paymentMethod: "PayPal",
  currency: "USD",
  students: [
    {
      id: "std-001",
      name: "Ali Ahmed",
      teacher: "Dr. Sarah Mansour",
      hoursPerWeek: 4,
      classesLeft: 12,
      totalClasses: 12,
      language: "Arabic",
      gender: "male",
      status: "regular",
    },
    {
      id: "std-002",
      name: "Sara Ahmed",
      teacher: "Prof. Ahmed Omar",
      hoursPerWeek: 6,
      classesLeft: 8,
      totalClasses: 12,
      language: "English",
      gender: "female",
      status: "regular",
    },
  ],
};

const ParentProfileContainer: React.FC<ParentProfileContainerProps> = ({ id: _id }) => {
  // In a real app, we would fetch the parent by ID using _id
  const parent = useMemo(() => MOCK_PARENT, []);

  return <ParentProfileView parent={parent} />;
};

export default ParentProfileContainer;
