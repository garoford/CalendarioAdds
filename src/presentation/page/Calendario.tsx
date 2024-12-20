import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useParams } from "react-router";
import { Payments } from "../../use-case/payments";
import { useState, useEffect, useMemo } from "react";
import { IEvent } from "../../domain/event.type";
import 'font-awesome/css/font-awesome.min.css';

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

      // Ajustamos las fechas para que empiecen a medianoche local
      const startD = new Date(`${data.calendario.dateStart}T00:00:00`);
      const endD = new Date(`${data.calendario.dateEnd}T00:00:00`);

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

    // Start Date y End Date siguen sin permitir selección si son EndDate o fuera de rango, pero sí StartDate ahora.
    if ((endDate && sameDay(date, endDate))) {
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

  const handlePrevMonth = () => {
    if (viewDate) {
      const prevMonth = moment(viewDate).subtract(1, 'month').toDate();
      setViewDate(prevMonth);
    }
  };

  const handleNextMonth = () => {
    if (viewDate) {
      const nextMonth = moment(viewDate).add(1, 'month').toDate();
      setViewDate(nextMonth);
    }
  };

  const buttonStyle: IMyStyle = {
    position: 'absolute',
    top: '300px',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: 'white',
    border: '2px solid #333',
    fontWeight: 'bold',
    cursor: 'pointer',
    zIndex: 999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '20px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease',
  };

  return (
    <div style={{ position: 'relative' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        date={viewDate}
        toolbar={false}
        view="month"
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

              if (isStart) {
                textColor = "white";
                content = "Start Date";
              } else if (isEnd) {
                textColor = "white";
                content = "End Date";
              }

              // Ahora permitimos selección también en StartDate
              const canSelect = !isEnd && !outOfRange; 

              const style: IMyStyle = {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                fontWeight: "bold",
                color: textColor
              };

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
                </div>
              );
            }
          }
        }}
      />

      <button
        onClick={handlePrevMonth}
        style={{ ...buttonStyle, left: '10px' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
      >
        <i className="fa fa-chevron-left"></i>
      </button>

      <button
        onClick={handleNextMonth}
        style={{ ...buttonStyle, right: '10px' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
      >
        <i className="fa fa-chevron-right"></i>
      </button>

      <div style={{ marginTop: '20px' }}>
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
