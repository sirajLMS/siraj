import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeetingIntegrationConnectedAccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { StatusFilterSelect } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/StatusFilterSelect";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

afterEach(cleanup);

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Dashboard.SettingsMeetingIntegrations, locale);

describe("StatusFilterSelect", () => {
  test("associates the localized status label with the select", () => {
    renderWithWrapper(<StatusFilterSelect value="all" onChange={() => {}} labels={labels} />, { locale });
    expect(screen.getByRole("combobox", { name: labels.columns.status })).toBeInTheDocument();
  });

  test("renders the all-statuses option text from translations", () => {
    renderWithWrapper(<StatusFilterSelect value="all" onChange={() => {}} labels={labels} />, { locale });
    expect(screen.getByText(labels.filters.statusAll)).toBeInTheDocument();
  });

  test("invokes onChange when picking a specific status", async () => {
    const user = userEvent.setup();
    const onChange = mock(() => {});
    renderWithWrapper(<StatusFilterSelect value="all" onChange={onChange} labels={labels} />, { locale });

    await user.click(screen.getByRole("combobox", { name: labels.columns.status }));
    await user.click(await screen.findByRole("option", { name: labels.status.connected }));

    expect(onChange).toHaveBeenCalledWith(MeetingIntegrationConnectedAccountStatus.Connected);
  });
});
