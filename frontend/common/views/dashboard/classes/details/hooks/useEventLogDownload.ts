"use client";

import { useQuery } from "@apollo/client/react";
import { useEffect, useRef } from "react";
import { classStatusEventsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import type { ActionFeedbackState } from "@/frontend/common/views/dashboard/classes/details/types";
import type { ClassDetailsLabels } from "@/shared/locale";

export function useEventLogDownload(
  id: string,
  shouldLoadEvents: boolean,
  setShouldLoadEvents: (value: boolean) => void,
  setFeedbackState: (state: ActionFeedbackState | null) => void,
  t: ClassDetailsLabels
) {
  const { data: eventsData, error: eventsError } = useQuery(classStatusEventsQueryDocument, {
    variables: { classInstanceId: id },
    skip: !id || !shouldLoadEvents,
  });

  const setShouldLoadEventsRef = useRef(setShouldLoadEvents);
  useEffect(() => {
    setShouldLoadEventsRef.current = setShouldLoadEvents;
  });

  useEffect(() => {
    if (shouldLoadEvents && eventsData?.classStatusEvents) {
      try {
        const blob = new Blob([JSON.stringify(eventsData.classStatusEvents, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `class-${id}-events.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setFeedbackState({ message: t.actionFeedback.generateLogSuccess, severity: "success" });
      } catch (err) {
        logger.error("Error generating log:", err);
        setFeedbackState({ message: t.actionFeedback.generateLogError, severity: "error" });
      } finally {
        setShouldLoadEventsRef.current(false);
      }
    }
  }, [eventsData, shouldLoadEvents, id, t, setFeedbackState]);

  useEffect(() => {
    if (shouldLoadEvents && eventsError) {
      logger.error("Error fetching class status events:", eventsError);
      setFeedbackState({ message: t.loadError, severity: "error" });
      setShouldLoadEventsRef.current(false);
    }
  }, [eventsError, shouldLoadEvents, t, setFeedbackState]);
}
