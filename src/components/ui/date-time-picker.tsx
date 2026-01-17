import type { ChangeEvent } from "react";

interface DateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
}

export default function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [dateValue, timeValue] = value ? value.split("T") : ["", ""];

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextDate = event.target.value;
    if (!nextDate) {
      onChange("");
      return;
    }
    const nextTime = timeValue || "00:00";
    onChange(`${nextDate}T${nextTime}`);
  };

  const handleTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextTime = event.target.value;
    if (!nextTime) {
      onChange("");
      return;
    }
    const nextDate = dateValue || "";
    if (!nextDate) {
      onChange("");
      return;
    }
    onChange(`${nextDate}T${nextTime}`);
  };

  return (
    <div className="date-time-picker">
      <input type="date" value={dateValue} onChange={handleDateChange} />
      <input type="time" value={timeValue} onChange={handleTimeChange} />
    </div>
  );
}
