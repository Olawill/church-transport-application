import React, { useState } from "react";
import { parseDate } from "chrono-node";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Calendar } from "./ui/calendar";

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

interface CustomDateCalendarProp {
  label: string;
  setRequestDateFilter: (value: Date | undefined) => void;
  requestDateFilter: Date | undefined;
}

const CustomDateCalendar = ({
  label,
  setRequestDateFilter,
  requestDateFilter,
}: CustomDateCalendarProp) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("In 2 days");
  // const [date, setDate] = useState<Date | undefined>(
  //   parseDate(value) || undefined
  // );
  const [month, setMonth] = useState<Date | undefined>(requestDateFilter);

  const handleParseDate = () => {
    setRequestDateFilter(parseDate(value) || undefined);
  };

  // useEffect(() => {
  //   if (!requestDateFilter) {
  //     setDate(undefined);
  //   }
  // }, [requestDateFilter]);

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
            const date = parseDate(e.target.value);
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

export default CustomDateCalendar;
