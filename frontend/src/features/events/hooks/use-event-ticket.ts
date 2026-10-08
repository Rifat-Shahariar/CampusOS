"use client";

import { useEffect, useState, useCallback } from "react";
import QRCode from "qrcode";
import { eventsApi } from "../api/events-api";
import type { EventTicket } from "../types";

export function useEventTicket(eventId: string) {
  const [ticket, setTicket] = useState<EventTicket | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = useCallback(
    (id: string) => {
      let isCurrent = true;

      eventsApi
        .getTicket(id)
        .then(async (ticketData) => {
          if (!isCurrent) return;
          setTicket(ticketData);

          // Generate QR code data URL purely client-side from qrToken
          try {
            const dataUrl = await QRCode.toDataURL(ticketData.qrToken, {
              width: 280,
              margin: 2,
              errorCorrectionLevel: "M",
              color: {
                dark: "#0f172a",
                light: "#ffffff",
              },
            });
            if (isCurrent) {
              setQrDataUrl(dataUrl);
              setError(null);
              setIsLoading(false);
            }
          } catch {
            if (isCurrent) {
              setError("Failed to generate QR code");
              setIsLoading(false);
            }
          }
        })
        .catch((err) => {
          if (isCurrent) {
            setError(err?.message || "Failed to load ticket");
            setIsLoading(false);
          }
        });

      return () => {
        isCurrent = false;
      };
    },
    [],
  );

  useEffect(() => {
    return fetchTicket(eventId);
  }, [fetchTicket, eventId]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchTicket(eventId);
  }, [fetchTicket, eventId]);

  return {
    ticket,
    qrDataUrl,
    isLoading,
    error,
    refetch,
  };
}
