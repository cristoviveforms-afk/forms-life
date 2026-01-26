import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";

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

const YEARS = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

export function MonthYearPicker({ onDateChange }: MonthYearPickerProps) {
    const [month, setMonth] = useState(new Date().getMonth().toString());
    const [year, setYear] = useState(new Date().getFullYear().toString());

    useEffect(() => {
        updateDates(month, year);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateDates = (selectedMonth: string, selectedYear: string) => {
        const y = parseInt(selectedYear);
        const m = parseInt(selectedMonth);

        // First day of the month
        const start = new Date(y, m, 1);
        // Last day of the month
        const end = new Date(y, m + 1, 0);

        // Format as YYYY-MM-DD
        // Adjust for timezone offset to ensure we get the correct "day" string locally if needed, 
        // but typically YYYY-MM-DD is safeish if we construct it manually to avoid timezone shifts.

        // Safer manual construction:
        const startStr = `${y}-${(m + 1).toString().padStart(2, '0')}-01`;
        const endStr = `${y}-${(m + 1).toString().padStart(2, '0')}-${end.getDate().toString().padStart(2, '0')}`;

        onDateChange(startStr, endStr);
    };

    const handleMonthChange = (val: string) => {
        setMonth(val);
        updateDates(val, year);
    };

    const handleYearChange = (val: string) => {
        setYear(val);
        updateDates(month, val);
    };

    return (
        <div className="flex gap-2">
            <Select value={month} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                    {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                            {m.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={year} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                    {YEARS.map((y) => (
                        <SelectItem key={y} value={y}>
                            {y}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
