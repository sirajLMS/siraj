import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import {
  CatalogImageUploadMobile,
  type CatalogImageUploadProps,
} from "@/frontend/mobile/components/ui/input/catalogImageUpload/catalogImageUpload.mobile";

const SAMPLE_IMAGE_URL = "https://picsum.photos/seed/catalog-upload/128";

function CatalogImageUploadStory(props: Readonly<CatalogImageUploadProps>) {
  const [imageUrl, setImageUrl] = useState<string | null>(props.imageUrl ?? null);

  return (
    <Box sx={{ width: 375, p: 2 }}>
      <CatalogImageUploadMobile
        {...props}
        imageUrl={imageUrl}
        onImageUrlChangeAction={setImageUrl}
        onUploadAction={async file => {
          const url = URL.createObjectURL(file);
          setImageUrl(url);
          return { url };
        }}
        onFilePathChangeAction={() => undefined}
      />
    </Box>
  );
}

const meta: Meta<typeof CatalogImageUploadStory> = {
  title: "UI/CatalogImageUpload/Mobile",
  component: CatalogImageUploadStory,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
  args: {
    label: "Catalog logo",
    maxSizeMb: 2,
  },
};

export default meta;
type Story = StoryObj<typeof CatalogImageUploadStory>;

export const Default: Story = {};

export const WithPreview: Story = {
  args: {
    imageUrl: SAMPLE_IMAGE_URL,
  },
};

export const WithUrlFallback: Story = {
  args: {
    allowUrlFallback: true,
    imageUrl: SAMPLE_IMAGE_URL,
  },
};

export const WithError: Story = {
  args: {
    error: true,
    errorMessage: "Unsupported file type. Only PNG, JPG, or WebP are allowed.",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    imageUrl: SAMPLE_IMAGE_URL,
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    label: "شعار الكتالوج",
    allowUrlFallback: true,
    imageUrl: SAMPLE_IMAGE_URL,
  },
};
