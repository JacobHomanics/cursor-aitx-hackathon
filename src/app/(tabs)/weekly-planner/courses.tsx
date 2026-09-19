import { useAction, useConvexAuth, useQuery } from 'convex/react';

import { CourseCard } from '@/components/planner-cards';
import { PlannerFrame } from '@/components/planner-frame';
import { ThemedText } from '@/components/themed-text';
import { useCompletedItems } from '@/hooks/use-completed-items';
import { usePlannerLoad } from '@/hooks/use-planner-load';
import { api } from '@convex/_generated/api';

export default function WeeklyCoursesScreen() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : 'skip');
  const latest = useQuery(api.courses.latest, isAuthenticated ? {} : 'skip');
  const analyzeCourses = useAction(api.courses.analyzeCourses);
  const { completedIds, setItemCompleted } = useCompletedItems('course');
  const { busy, error } = usePlannerLoad({
    ready: Boolean(isAuthenticated && user),
    hasLatest: latest === undefined ? undefined : latest !== null,
    load: () => analyzeCourses({}),
    fallbackError: 'Could not update courses',
  });

  return (
    <PlannerFrame>
      {!user ? (
        <ThemedText type="small" themeColor="textSecondary">
          Loading this week's plan…
        </ThemedText>
      ) : (
        <>
          {error ? (
            <ThemedText type="small" themeColor="textSecondary">
              {error}
            </ThemedText>
          ) : null}

          {busy || latest === undefined ? (
            <ThemedText type="small" themeColor="textSecondary">
              Finding courses…
            </ThemedText>
          ) : latest === null || latest.courses.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              No course picks this week.
            </ThemedText>
          ) : (
            latest.courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                completed={completedIds.has(course.id)}
                onCompletedChange={(completed) => setItemCompleted(course.id, completed)}
              />
            ))
          )}
        </>
      )}
    </PlannerFrame>
  );
}
