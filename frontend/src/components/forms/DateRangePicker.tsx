import { Calendar as CalendarIcon } from "lucide-react";
import React from "react";
import { Calendar } from "../../components/forms/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/forms/Popover";
import Button from "../../components/ui/Button";
import { cn } from "../../lib/utils";
import { formatDate } from "../../utils/formatting";

interface DateRangePickerProps {
  fromDate?: Date;
  toDate?: Date;
  onChange: (fromDate?: Date, toDate?: Date) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ fromDate, toDate, onChange, className }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<{
    from?: Date;
    to?: Date;
  }>({ from: fromDate, to: toDate });

  React.useEffect(() => {
    setDateRange({ from: fromDate, to: toDate });
  }, [fromDate, toDate]);

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) {
      setDateRange({ from: undefined, to: undefined });
      return;
    }

    setDateRange(range);

    // Only close and call onChange when both dates are selected
    if (range.from && range.to) {
      setIsOpen(false);
      onChange(range.from, range.to);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button id="date" variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {formatDate(dateRange.from, { month: "short", day: "numeric", year: "numeric" })} - {formatDate(dateRange.to, { month: "short", day: "numeric", year: "numeric" })}
                </>
              ) : (
                formatDate(dateRange.from, { month: "short", day: "numeric", year: "numeric" })
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={handleSelect} numberOfMonths={2} disabled={date => date > new Date() || date < new Date("1900-01-01")} />
          {dateRange.from && !dateRange.to && <div className="p-2 text-center text-sm text-muted-foreground">Select the end date</div>}
        </PopoverContent>
      </Popover>
    </div>
  );
};
