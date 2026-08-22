import { useEffect, useState } from "react";
import { getCountdown, type Countdown } from "@/lib/waitlist-utils";

const EMPTY_COUNTDOWN: Countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };

export function useCountdown(deadline?: string) {
  const [countdown, setCountdown] = useState<Countdown>(EMPTY_COUNTDOWN);

  useEffect(() => {
    setCountdown(getCountdown(deadline));

    if (!deadline) return;

    const intervalId = window.setInterval(() => {
      setCountdown(getCountdown(deadline));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [deadline]);

  return countdown;
}

export function useCountUp(target: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!target) {
      setValue(0);
      return;
    }

    let frame = 0;
    const total = 40;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (intervalId === null) return;
      clearInterval(intervalId);
      intervalId = null;
    };

    intervalId = setInterval(() => {
      frame += 1;
      setValue(Math.round((target * frame) / total));
      if (frame >= total) stop();
    }, 20);

    return () => {
      stop();
    };
  }, [target]);

  return value;
}
