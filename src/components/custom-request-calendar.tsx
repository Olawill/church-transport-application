import { parseDate } from "chrono-node";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const formatDate = (date: Date | undefined) => {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("en-CA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

function safeParseDate(
  input: string,
  referenceDate: Date = new Date()
): Date | null {
  const trimmed = input.trim();

  if (trimmed.length === 0 || trimmed.length > 200) {
    return null;
  }

  return parseDate(trimmed, referenceDate) || null;
}

interface CustomDateCalendarProp {
  label: string;
  setRequestDateFilter: (value: Date | undefined) => void;
  requestDateFilter: Date | undefined;
}

export const CustomDateCalendar = ({
  label,
  setRequestDateFilter,
  requestDateFilter,
}: CustomDateCalendarProp) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("In 2 days");

  const [month, setMonth] = useState<Date | undefined>(requestDateFilter);

  const handleParseDate = () => {
    setRequestDateFilter(safeParseDate(value) || undefined);
  };

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="date" className="px-1">
        {label}
      </Label>

      <div className="relative flex gap-2">
        <Input
          id="date"
          value={value}
          placeholder="Tomorrow or next week"
          className="bg-background pr-10"
          onChange={(e) => {
            setValue(e.target.value);
            const date = safeParseDate(e.target.value);
            if (date) {
              // setDate(date);
              handleParseDate();
              setMonth(date);
              setRequestDateFilter(date);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date-picker"
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="end">
            <Calendar
              mode="single"
              selected={requestDateFilter}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={(date) => {
                // setDate(date);
                handleParseDate();
                setValue(formatDate(date));
                setOpen(false);
                if (date) setRequestDateFilter(date);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
