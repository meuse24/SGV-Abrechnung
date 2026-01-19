import type { ChangeEvent } from "react";

interface TimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  stepMinutes?: number;
}

export default function TimePicker({
  value,
  onChange,
  id,
  name,
  placeholder,
  stepMinutes = 1
}: TimePickerProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <input
      type="time"
      id={id}
      name={name}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={handleChange}
      step={stepMinutes * 60}
      autoComplete="off"
      data-ms-editor="false"
    />
  );
}
