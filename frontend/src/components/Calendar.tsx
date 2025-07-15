import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarProps {
  selectedDate: Date | null;
  selectedDateRange: { start: Date | null; end: Date | null };
  onDateSelect: (date: Date) => void;
  onDateRangeChange: (range: { start: Date | null; end: Date | null }) => void;
  onDateChange: (date: Date | null) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  selectedDateRange,
  onDateSelect,
  onDateRangeChange,
  onDateChange,
  onCancel,
  onConfirm
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const prevMonth = () => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const selectDate = (date: Date) => {
    // Si no hay fecha de inicio seleccionada, establecer esta como inicio
    if (!selectedDateRange.start) {
      onDateRangeChange({
        start: date,
        end: null
      });
      onDateChange(date);
    } 
    // Si hay fecha de inicio pero no de fin, establecer esta como fin
    else if (selectedDateRange.start && !selectedDateRange.end) {
      const start = selectedDateRange.start;
      const end = date;
      
      // Si la fecha seleccionada es anterior a la de inicio, intercambiar
      if (end < start) {
        onDateRangeChange({
          start: end,
          end: start
        });
        onDateChange(end);
      } else {
        onDateRangeChange({
          start: start,
          end: end
        });
        onDateChange(end);
      }
    } 
    // Si ya hay un rango completo, reiniciar con la nueva fecha
    else {
      onDateRangeChange({
        start: date,
        end: null
      });
      onDateChange(date);
    }
  };

  // Función auxiliar para verificar si una fecha está en el rango seleccionado
  const isDateInRange = (date: Date) => {
    if (!selectedDateRange.start) return false;
    
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    
    const start = new Date(selectedDateRange.start);
    start.setHours(0, 0, 0, 0);
    
    if (!selectedDateRange.end) {
      // Si solo hay fecha de inicio, solo esa fecha está seleccionada
      return dateToCheck.getTime() === start.getTime();
    }
    
    const end = new Date(selectedDateRange.end);
    end.setHours(0, 0, 0, 0);
    
    return dateToCheck >= start && dateToCheck <= end;
  };

  // Función auxiliar para verificar si una fecha es el inicio del rango
  const isDateRangeStart = (date: Date) => {
    if (!selectedDateRange.start) return false;
    
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    
    const start = new Date(selectedDateRange.start);
    start.setHours(0, 0, 0, 0);
    
    return dateToCheck.getTime() === start.getTime();
  };

  // Función auxiliar para verificar si una fecha es el fin del rango
  const isDateRangeEnd = (date: Date) => {
    if (!selectedDateRange.end) return false;
    
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    
    const end = new Date(selectedDateRange.end);
    end.setHours(0, 0, 0, 0);
    
    return dateToCheck.getTime() === end.getTime();
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);
    
    // Día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
    const firstDayOfWeek = firstDay.getDay();
    // Ajustar para que lunes sea 0
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const days = [];
    
    // Agregar días del mes anterior (solo los necesarios para completar la primera semana)
    for (let i = adjustedFirstDay; i > 0; i--) {
      const day = new Date(year, month, -i + 1);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    // Agregar días del mes actual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i);
      days.push({ date: day, isCurrentMonth: true });
    }
    
    // Agregar días del mes siguiente para completar exactamente 42 días (6 filas x 7 columnas)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    return days;
  };

  return (
    <>
      <style>
        {`
          .custom-calendar {
            width: 100%;
            max-width: 100%;
            overflow: hidden;
          }

          @media (max-width: 768px) {
            .custom-calendar {
              max-width: calc(100vw - 2rem);
              margin: 0 auto;
            }
            
            .calendar-day {
              padding: 0.5rem 0.25rem;
              font-size: 0.75rem;
              min-height: 2rem;
            }
            
            .weekday-header {
              padding: 0.5rem 0.25rem;
              font-size: 0.7rem;
            }
            
            .current-month {
              font-size: 1rem;
            }
            
            .calendar-actions {
              gap: 0.75rem;
            }
            
            .cancel-date-button,
            .select-date-button {
              padding: 0.5rem 0.75rem;
              font-size: 0.8rem;
            }
          }

          .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
          }

          .month-nav-button {
            background: none;
            border: none;
            color: #ffffff;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 0.5rem;
            transition: all 0.3s ease;
          }

          .month-nav-button:hover {
            background: rgba(255, 255, 255, 0.1);
          }

          .current-month {
            font-size: 1.125rem;
            font-weight: 600;
            color: #ffffff;
            margin: 0;
            text-transform: capitalize;
          }

          .calendar-weekdays {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 0.25rem;
            margin-bottom: 0.5rem;
          }

          .weekday-header {
            background: #323741;
            color: #656A78;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.75rem 0.5rem;
            text-align: center;
            border-radius: 0.5rem;
          }

          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 0.25rem;
            margin-bottom: 2rem;
          }

          .calendar-day {
            background: #171717;
            color: #ffffff;
            border: none;
            border-radius: 0.5rem;
            padding: 0.75rem 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
            min-height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .calendar-day:hover {
            background: rgba(255, 255, 255, 0.1);
          }

          .calendar-day.other-month {
            color: #656A78;
          }

          .calendar-day.selected-day {
            background: #153a9e;
            color: #ffffff;
            border: 2px solid #1a48c4;
          }

          /* Estilos para el rango de fechas */
          .calendar-day.in-range {
            background: linear-gradient(90deg, rgba(26, 72, 196, 0.2), rgba(26, 72, 196, 0.15));
            color: #ffffff;
            border-radius: 0;
            position: relative;
            z-index: 1;
          }

          .calendar-day.range-start {
            background: linear-gradient(135deg, #1a48c4, #153a9e);
            color: #ffffff;
            border: 2px solid #ffffff;
            border-radius: 0.5rem 0 0 0.5rem;
            position: relative;
            z-index: 3;
            box-shadow: 0 2px 8px rgba(26, 72, 196, 0.3);
            font-weight: 600;
          }

          .calendar-day.range-end {
            background: linear-gradient(135deg, #1a48c4, #153a9e);
            color: #ffffff;
            border: 2px solid #ffffff;
            border-radius: 0 0.5rem 0.5rem 0;
            position: relative;
            z-index: 3;
            box-shadow: 0 2px 8px rgba(26, 72, 196, 0.3);
            font-weight: 600;
          }

          .calendar-day.range-start.range-end {
            border-radius: 0.5rem;
          }

          /* Efecto de conexión entre fechas del rango */
          .calendar-day.in-range::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, rgba(26, 72, 196, 0.1), rgba(26, 72, 196, 0.05));
            z-index: 1;
          }

          /* Indicador visual del rango seleccionado */
          .calendar-day.in-range:hover {
            background: linear-gradient(90deg, rgba(26, 72, 196, 0.3), rgba(26, 72, 196, 0.25));
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(26, 72, 196, 0.2);
          }

          .calendar-day.range-start:hover,
          .calendar-day.range-end:hover {
            background: linear-gradient(135deg, #1a48c4, #0f2d7a);
            transform: scale(1.1);
            box-shadow: 0 4px 16px rgba(26, 72, 196, 0.4);
          }

          .calendar-actions {
            display: flex;
            gap: 1rem;
          }

          .cancel-date-button {
            flex: 1;
            padding: 0.75rem 1rem;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.75rem;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .cancel-date-button:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.3);
            color: #ffffff;
          }

          .select-date-button {
            flex: 1;
            padding: 0.75rem 1rem;
            background: #1a48c4;
            border: none;
            border-radius: 0.75rem;
            color: #ffffff;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .select-date-button:hover {
            background: #153a9e;
            transform: translateY(-1px);
          }

          .calendar-day.other-month {
            color: #656A78;
          }

          .calendar-day:disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }

          .calendar-day:disabled:hover {
            background: #171717;
          }
        `}
      </style>

      <div className="custom-calendar">
        <div className="calendar-header">
          <button className="month-nav-button" onClick={prevMonth}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h4 className="current-month">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h4>
          <button className="month-nav-button" onClick={nextMonth}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
        
        {/* Indicador del rango seleccionado */}
        {selectedDateRange.start && (
          <div className="mb-4 p-3 bg-[#1a48c4]/10 border border-[#1a48c4]/20 rounded-lg">
            <p className="text-sm text-white font-medium">
              {selectedDateRange.end 
                ? `Rango seleccionado: ${format(selectedDateRange.start, "dd/MM/yyyy", { locale: es })} - ${format(selectedDateRange.end, "dd/MM/yyyy", { locale: es })}`
                : `Fecha seleccionada: ${format(selectedDateRange.start, "dd/MM/yyyy", { locale: es })}`
              }
            </p>
            <p className="text-xs text-white/70 mt-1">
              {selectedDateRange.end 
                ? "Haz clic en otra fecha para cambiar el rango"
                : "Haz clic en otra fecha para completar el rango"
              }
            </p>
          </div>
        )}
        
        <div className="calendar-weekdays">
          {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((day) => (
            <div key={day} className="weekday-header">{day}</div>
          ))}
        </div>
        
        <div className="calendar-grid">
          {getCalendarDays().map((day, index) => {
            const isInRange = isDateInRange(day.date);
            const isRangeStart = isDateRangeStart(day.date);
            const isRangeEnd = isDateRangeEnd(day.date);
            
            return (
              <button
                key={index}
                className={`calendar-day ${
                  !day.isCurrentMonth ? 'other-month' : ''
                } ${
                  isInRange ? 'in-range' : ''
                } ${
                  isRangeStart ? 'range-start' : ''
                } ${
                  isRangeEnd ? 'range-end' : ''
                }`}
                onClick={() => day.isCurrentMonth && selectDate(day.date)}
                disabled={!day.isCurrentMonth}
              >
                {day.date.getDate()}
              </button>
            );
          })}
        </div>
        
        <div className="calendar-actions">
          <button 
            className="cancel-date-button" 
            onClick={onCancel}
          >
            Limpiar
          </button>
          <button 
            className="select-date-button" 
            onClick={onConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </>
  );
};

export default Calendar; 