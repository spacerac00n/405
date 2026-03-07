export type OnboardingProfile = {
  householdSize: "1" | "2" | "3-4" | "5+";
  homeType: "3-room" | "4-room" | "5-room" | "condo";
  priority: "bill" | "carbon" | "peak" | "all";
  airconFrequency: "rarely" | "few_nights" | "almost_nightly" | "day_and_night";
  airconWindow: "afternoon" | "evening" | "overnight" | "varies";
  airconDuration: "<2h" | "2-4h" | "4-8h" | "overnight";
  showerWindow: "morning" | "evening" | "both";
  showerLength: "short" | "medium" | "long";
  laundryFrequency: "1-2" | "3-4" | "daily";
  laundryWindow: "weekday_evening" | "weekend" | "morning" | "varies";
};

export type OnboardingStep = "household" | "aircon" | "heater" | "laundry";

export const defaultOnboardingProfile: OnboardingProfile = {
  householdSize: "2",
  homeType: "4-room",
  priority: "all",
  airconFrequency: "few_nights",
  airconWindow: "evening",
  airconDuration: "2-4h",
  showerWindow: "both",
  showerLength: "medium",
  laundryFrequency: "1-2",
  laundryWindow: "weekend",
};
