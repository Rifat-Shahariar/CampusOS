"use client";

import { useEffect, useState } from "react";
import { resourcesApi } from "../api/resources-api";
import type { CourseItem } from "../types";

export function useResourceCourses() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    resourcesApi
      .getCourses()
      .then((data) => {
        if (isCurrent) {
          setCourses(data);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          setError(err?.message || "Failed to load courses");
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  return { courses, isLoading, error };
}
