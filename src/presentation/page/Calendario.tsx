
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useParams } from "react-router";
import { Payments } from "../../use-case/payments";
import { useState, useEffect, useMemo } from "react";
import { IEvent } from "../../domain/event.type";

const localizer = momentLocalizer(moment);

interface IMyStyle {
  [key: string]: string | number;
}

export const Calendario = () => {
  const { id } = useParams<{ id: string }>();
  const [maxSelections, setMaxSelections] = useState<number>(0);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [datesCount, setDatesCount] = useState<{ [dateStr: string]: number }>({});
  const [viewDate, setViewDate] = useState<Date | null>(null);

  useEffect(() => {
    const getDate = async () => {
      if (!id) return;
      const data = await Payments.getPayments(id);
      const startD = new Date(data.calendario.dateStart);
      const endD = new Date(data.calendario.dateEnd);

      setStartDate(startD);
      setEndDate(endD);
      setMaxSelections(data.contador);
      setViewDate(startD); 
    };

    getDate();
  }, [id]);

  const sameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const getDateKey = (date: Date) => moment(date).startOf('day').format("YYYY-MM-DD");

  const events: IEvent[] = useMemo(() => {
    const evts: IEvent[] = [];
    for (const dateStr in datesCount) {
      const count = datesCount[dateStr];
      if (count > 0) {
        const [year, month, day] = dateStr.split("-").map(Number);
        const parsedDate = new Date(year, month - 1, day);
        for (let i = 0; i < count; i++) {
          evts.push({
            title: "Selected Date",
            start: parsedDate,
            end: parsedDate,
          });
        }
      }
    }
    return evts;
  }, [datesCount]);

  const totalSelections = useMemo(() => {
    return Object.values(datesCount).reduce((sum, val) => sum + val, 0);
  }, [datesCount]);

  const handleAddSelection = (date: Date) => {
    if (!startDate || !endDate) return;

    const startDateMinusTwo = moment(startDate).subtract(2, 'days').toDate();
    if (date < startDateMinusTwo || date > endDate) return;

    if ((startDate && sameDay(date, startDate)) || (endDate && sameDay(date, endDate))) {
      return; 
    }

    if (totalSelections >= maxSelections) {
      alert(`Solo puedes seleccionar ${maxSelections} fechas en total.`);
      return;
    }

    const dateStr = getDateKey(date);
    setDatesCount(prev => ({
      ...prev,
      [dateStr]: (prev[dateStr] || 0) + 1
    }));
  };

  const handleRemoveSelection = (date: Date) => {
    const dateStr = getDateKey(date);
    const currentCount = datesCount[dateStr] || 0;
    if (currentCount > 0) {
      setDatesCount(prev => ({
        ...prev,
        [dateStr]: currentCount - 1
      }));
    }
  };

  const formatDates = (datesObj: { [dateStr: string]: number }) => {
    const allDates: Date[] = [];
    for (const dateStr in datesObj) {
      const count = datesObj[dateStr];
      const [year, month, day] = dateStr.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      for (let i = 0; i < count; i++) {
        allDates.push(d);
      }
    }

    const sortedDates = [...allDates].sort((a, b) => a.getTime() - b.getTime());
    return sortedDates.map(date => moment(date).format("YYYY-MM-DD"));
  };

  const handleUpdatePayments = async () => {
    if (!id) return;
    const formattedDates = formatDates(datesCount);
    const data = await Payments.updatePayments(id, formattedDates);
    console.log(data);
    alert("Fechas actualizadas con éxito!");
  };

  if (!viewDate || !startDate || !endDate) {
    return <div>Cargando...</div>;
  }

  const startDateMinusTwo = moment(startDate).subtract(2, 'days').toDate();

  // dayPropGetter: 
  // - Start/End date: rojo
  // - Fuera de rango: gris
  // - Resto: blanco
  const dayPropGetter = (date: Date) => {
    const isStart = sameDay(date, startDate);
    const isEnd = sameDay(date, endDate);
    const outOfRange = date < startDateMinusTwo || date > endDate;

    let backgroundColor = "white";

    if (isStart || isEnd) {
      backgroundColor = "red";
    } else if (outOfRange) {
      backgroundColor = "#dddddd";
    }

    return { style: { backgroundColor } };
  };

  return (
    <div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        date={viewDate}
        onNavigate={(newDate) => setViewDate(newDate)}
        view="month"
        onView={() => {}}
        dayPropGetter={dayPropGetter}
        components={{
          month: {
            dateHeader: ({ label, date }) => {
              const dateStr = getDateKey(date);
              const count = datesCount[dateStr] || 0;
              const isStart = sameDay(date, startDate);
              const isEnd = sameDay(date, endDate);
              const outOfRange = date < startDateMinusTwo || date > endDate;

              let textColor = "black";
              let content = label;

              // Start/End date con texto blanco
              if (isStart) {
                textColor = "white";
                content = "Start Date";
              } else if (isEnd) {
                textColor = "white";
                content = "End Date";
              }

              const style: IMyStyle = {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                fontWeight: "bold",
                color: textColor
              };

              // canSelect = true solo si no es start/end ni está fuera de rango
              const canSelect = !isStart && !isEnd && !outOfRange;

              return (
                <div style={style}>
                  {content}
                  {canSelect && (
                    <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                      <button onClick={() => handleRemoveSelection(date)} disabled={count === 0}>
                        –
                      </button>
                      <button onClick={() => handleAddSelection(date)}>
                        +
                      </button>
                    </div>
                  )}
                  {count > 0 && <div style={{ fontSize: "0.8em" }}>Count: {count}</div>}
                </div>
              );
            }
          }
        }}
      />
      <div>
        <h3>Fechas seleccionadas:</h3>
        <ul>
          {formatDates(datesCount).map((dateStr, index) => (
            <li key={index}>{dateStr}</li>
          ))}
        </ul>
      </div>
      <button onClick={handleUpdatePayments}>Actualizar Fechas</button>
    </div>
  );
};
