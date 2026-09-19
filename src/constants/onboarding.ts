export const COLLEGE_YEARS = [
  { value: 'first_year', label: '1st year' },
  { value: 'second_year', label: '2nd year' },
  { value: 'third_year', label: '3rd year' },
  { value: 'fourth_year', label: '4th year' },
  { value: 'fifth_year_plus', label: '5th year or more' },
  { value: 'graduate', label: 'Graduate / professional' },
  { value: 'other', label: 'Other / not a student' },
] as const;

export type CollegeYear = (typeof COLLEGE_YEARS)[number]['value'];

export function collegeYearLabel(value: CollegeYear | undefined) {
  return COLLEGE_YEARS.find((year) => year.value === value)?.label;
}
