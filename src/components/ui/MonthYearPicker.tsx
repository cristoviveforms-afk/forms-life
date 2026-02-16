import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, LayoutGrid } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface MonthYearPickerProps {
    onDateChange: (startDate: string, endDate: string) => void;
}

const MONTHS = [
    { value: "0", label: "Janeiro" },
    { value: "1", label: "Fevereiro" },
    { value: "2", label: "Março" },
    { value: "3", label: "Abril" },
    { value: "4", label: "Maio" },
    { value: "5", label: "Junho" },
    { value: "6", label: "Julho" },
    { value: "7", label: "Agosto" },
    { value: "8", label: "Setembro" },
    { value: "9", label: "Outubro" },
    { value: "10", label: "Novembro" },
    { value: "11", label: "Dezembro" },
];

const YEARS = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() + 1 - i).toString());

export function MonthYearPicker({ onDateChange }: MonthYearPickerProps) {
    const [month, setMonth] = useState(new Date().getMonth().toString());
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [days, setDays] = useState<{ day: number; weekday: number; isWeekend: boolean; isFriday: boolean; isWednesday: boolean }[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        calculateDays(parseInt(month), parseInt(year));
        // We don't call updateDates here because calculateDays is called, 
        // but we need an initial trigger. Let's do it.
        const y = parseInt(year);
        const m = parseInt(month);
        const lastDayDate = new Date(y, m + 1, 0);
        const startStr = `${y}-${(m + 1).toString().padStart(2, '0')}-01`;
        const endStr = `${y}-${(m + 1).toString().padStart(2, '0')}-${lastDayDate.getDate().toString().padStart(2, '0')}`;
        onDateChange(startStr, endStr);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const calculateDays = (m: number, y: number) => {
        const lastDay = new Date(y, m + 1, 0).getDate();
        const daysArray = [];
        for (let i = 1; i <= lastDay; i++) {
            const date = new Date(y, m, i);
            const weekday = date.getDay();
            daysArray.push({
                day: i,
                weekday,
                isWeekend: weekday === 0 || weekday === 6,
                isFriday: weekday === 5,
                isWednesday: weekday === 3
            });
        }
        setDays(daysArray);
    };

    const triggerChange = (m: string, y: string, day: number | null) => {
        const yearInt = parseInt(y);
        const monthInt = parseInt(m);

        if (day) {
            const dayStr = day.toString().padStart(2, '0');
            const monthStr = (monthInt + 1).toString().padStart(2, '0');
            const dateStr = `${yearInt}-${monthStr}-${dayStr}`;
            onDateChange(dateStr, dateStr);
        } else {
            const lastDayDate = new Date(yearInt, monthInt + 1, 0);
            const startStr = `${yearInt}-${(monthInt + 1).toString().padStart(2, '0')}-01`;
            const endStr = `${yearInt}-${(monthInt + 1).toString().padStart(2, '0')}-${lastDayDate.getDate().toString().padStart(2, '0')}`;
            onDateChange(startStr, endStr);
        }
    };

    const handleMonthChange = (val: string) => {
        setMonth(val);
        setSelectedDay(null);
        calculateDays(parseInt(val), parseInt(year));
        triggerChange(val, year, null);
    };

    const handleYearChange = (val: string) => {
        setYear(val);
        setSelectedDay(null);
        calculateDays(parseInt(month), parseInt(val));
        triggerChange(month, val, null);
    };

    const handleDayClick = (day: number) => {
        if (selectedDay === day) {
            setSelectedDay(null);
            triggerChange(month, year, null);
        } else {
            setSelectedDay(day);
            triggerChange(month, year, day);
        }
    };

    const handleViewAll = () => {
        setSelectedDay(null);
        triggerChange(month, year, null);
    };

    const getWeekdayLabel = (weekday: number) => {
        return ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][weekday];
    };

    return (
        <div className="flex flex-col gap-4 w-full bg-card/30 p-4 rounded-3xl border border-border/40 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-xl">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-bold text-lg hidden sm:inline-block">Período</span>
                </div>

                <div className="flex gap-2">
                    <Select value={month} onValueChange={handleMonthChange}>
                        <SelectTrigger className="w-[130px] h-10 rounded-xl bg-background/50 border-border/40 focus:ring-primary/20">
                            <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {MONTHS.map((m) => (
                                <SelectItem key={m.value} value={m.value} className="rounded-lg">
                                    {m.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={year} onValueChange={handleYearChange}>
                        <SelectTrigger className="w-[90px] h-10 rounded-xl bg-background/50 border-border/40 focus:ring-primary/20">
                            <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {YEARS.map((y) => (
                                <SelectItem key={y} value={y} className="rounded-lg">
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-4" ref={scrollRef}>
                    <button
                        onClick={handleViewAll}
                        className={cn(
                            "flex flex-col items-center justify-center min-w-[70px] h-16 rounded-2xl border transition-all duration-200",
                            selectedDay === null
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                                : "bg-background/40 border-border/40 text-muted-foreground hover:bg-background/70"
                        )}
                    >
                        <LayoutGrid className={cn("h-4 w-4 mb-1", selectedDay === null ? "text-primary-foreground/80" : "text-muted-foreground/60")} />
                        <span className="text-[10px] uppercase font-black tracking-widest leading-none">Mês</span>
                    </button>

                    {days.map((d) => (
                        <button
                            key={d.day}
                            onClick={() => handleDayClick(d.day)}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[50px] h-16 rounded-2xl border transition-all duration-200",
                                selectedDay === d.day
                                    ? "ring-2 ring-primary ring-offset-2 bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                                    : d.isWeekend
                                        ? "bg-primary/20 text-primary border-primary/30"
                                        : (d.isFriday || d.isWednesday)
                                            ? "bg-primary/10 border-primary/20 text-primary"
                                            : "bg-background/40 border-border/40 text-muted-foreground hover:bg-background/70"
                            )}
                        >
                            <span className={cn(
                                "text-[10px] uppercase font-black tracking-widest leading-none mb-1",
                                selectedDay === d.day ? "text-primary-foreground/80" : "text-muted-foreground/60"
                            )}>
                                {getWeekdayLabel(d.weekday)}
                            </span>
                            <span className="text-lg font-black leading-none">{d.day}</span>
                        </button>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="h-1.5" />
            </ScrollArea>
        </div>
    );
}
