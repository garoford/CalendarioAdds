import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useParams } from "react-router";
import { Payments } from "../../use-case/payments";
import { useState, useEffect, useMemo } from "react";
import ClipLoader from "react-spinners/ClipLoader";



import "font-awesome/css/font-awesome.min.css";

// Componente de toolbar personalizado
const CustomToolbar = ({ date = new Date() }) => {
  const label = localizer.format(date, 'MMMM YYYY') || 'Fecha no disponible';

  return (
    <div style={{ textAlign: 'center', fontSize: '3em', fontWeight: 'bold', marginBottom: '20px' }}>
      {label}
    </div>
  );
};

moment.updateLocale("en", {
  week: {
    dow: 1, // 0 es domingo, 1 es lunes
  },
});

const localizer = momentLocalizer(moment);

interface IMyStyle {
  [key: string]: string | number;
}

export const Calendario = () => {
  const { id } = useParams<{ id: string }>();
  const [maxSelections, setMaxSelections] = useState<number>(0);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [datesCount, setDatesCount] = useState<{ [dateStr: string]: number }>(
    {}
  );
  const [viewDate, setViewDate] = useState<Date | null>(null);

  // Aquí guardamos las fechas existentes (avisos) que vienen de getCalendario
  const [existingDates, setExistingDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const getDate = async () => {
      if (!id) return;
      const data = await Payments.getPayments(id);

      // Ajustamos las fechas a medianoche
      const startD = new Date(`${data.calendario.dateStart}T00:00:00`);
      const endD = new Date(`${data.calendario.dateEnd}T00:00:00`);

      setStartDate(startD);
      setEndDate(endD);
      setMaxSelections(data.contador);
      setViewDate(startD);

      // Procesamos getCalendario para extraer las fechas ya existentes
      // Suponemos que cada elemento de getCalendario tiene 'date_ads'
      const existing = new Set<string>();
      data.getCalendario.forEach((item: { date_ads: string }) => {
        // Normalizamos la fecha a formato YYYY-MM-DD
        const dateStr = moment(item.date_ads, "YYYY-MM-DD").format(
          "YYYY-MM-DD"
        );
        existing.add(dateStr);
      });
      setExistingDates(existing);
    };

    getDate();
  }, [id]);

  const sameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const getDateKey = (date: Date) =>
    moment(date).startOf("day").format("YYYY-MM-DD");

  const totalSelections = useMemo(() => {
    return Object.values(datesCount).reduce((sum, val) => sum + val, 0);
  }, [datesCount]);

  const handleAddSelection = (date: Date) => {
    if (!startDate || !endDate) return;

    const startDateMinusTwo = moment(startDate).subtract(2, "days").toDate();
    if (date < startDateMinusTwo || date > endDate) return;

    // Si es EndDate, no permitimos selección
    if (endDate && sameDay(date, endDate)) {
      return;
    }

    if (totalSelections >= maxSelections) {
      alert(`Solo puedes seleccionar ${maxSelections} fechas en total.`);
      return;
    }

    const dateStr = getDateKey(date);
    setDatesCount((prev) => ({
      ...prev,
      [dateStr]: (prev[dateStr] || 0) + 1,
    }));
  };

  const handleRemoveSelection = (date: Date) => {
    const dateStr = getDateKey(date);
    const currentCount = datesCount[dateStr] || 0;
    if (currentCount > 0) {
      setDatesCount((prev) => ({
        ...prev,
        [dateStr]: currentCount - 1,
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
    return sortedDates.map((date) => moment(date).format("YYYY-MM-DD"));
  };

  const handleUpdatePayments = async () => {
    if (!id) return;

    const remaining = maxSelections - totalSelections;

    if (remaining < maxSelections) {
      const confirmed = window.confirm(
        "Hay menos fechas que avisos, ¿seguro que quieres actualizar las fechas?"
      );
      if (!confirmed) return;
    } else if (remaining === maxSelections) {
      const confirmed = window.confirm(
        "¿Estás seguro de actualizar las fechas?"
      );
      if (!confirmed) return;
    }

    const formattedDates = formatDates(datesCount);
    const data = await Payments.updatePayments(id, formattedDates);
    console.log(data);
    alert("Fechas actualizadas con éxito!");
    window.location.reload(); // Recarga la página
  };

  if (!viewDate || !startDate || !endDate) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <ClipLoader size={50} color={"#123abc"} loading={true} />
      </div>
    );
  }

  const startDateMinusTwo = moment(startDate).subtract(1, "days").toDate();

  // dayPropGetter: además de la lógica actual, si la fecha está en existingDates
  // y no es start/end/outOfRange, la pintamos de celeste (#e0f7fa).


  const getDayPropGetter = (referenceMonth: number) => (date: Date) => {
    const isStart = sameDay(date, startDate!);
    const isEnd = sameDay(date, endDate!);
    const outOfRange = date < startDateMinusTwo || date > endDate!;
    // const dateKey = getDateKey(date);
    // const isExisting = existingDates.has(dateKey);
    const isOutOfCurrentMonth = date.getMonth() !== referenceMonth;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0 es domingo y 6 es sábado

    let backgroundColor = ""; // En caso de que Julio se arrepienta le colocamos White
    let textColor = "black";

    if (isEnd) {
      backgroundColor = "red";
      textColor = "white";
    } else if (isStart) {
      backgroundColor = "green";
      textColor = "white";
    } else if (isOutOfCurrentMonth || isWeekend) {
      backgroundColor = "#e6e6e6";
      textColor = "black";
    } else if (outOfRange) {
      backgroundColor = "#e6e6e6";
      textColor = "black";
    }

    return { style: { backgroundColor, color: textColor } };
  };

  const dayDifference = moment(endDate).diff(moment(startDate), 'days');

  const handlePrevMonth = () => {
    if (viewDate) {
      const prevMonth = moment(viewDate).subtract(1, "month").toDate();
      setViewDate(prevMonth);
    }
  };

  const handleNextMonth = () => {
    if (viewDate) {
      const nextMonth = moment(viewDate).add(1, "month").toDate();
      setViewDate(nextMonth);
    }
  };

  const remaining = totalSelections;

  const buttonStyle: IMyStyle = {
    position: "absolute",
    top: "300px",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    backgroundColor: "white",
    border: "2px solid #333",
    fontWeight: "bold",
    cursor: "pointer",
    zIndex: 999,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "20px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
  };

  return (
    <div style={{ position: "relative" }}>
      <div className="calendar-container">
        <Calendar // para poder ver varias veces el mes, sacar de aqui el codigo
          localizer={localizer}
          events={[]}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700, width: "33.33%" }}
          date={viewDate}
          toolbar={true}
          view="month"
          dayPropGetter={getDayPropGetter(viewDate.getMonth())}
          components={{
            toolbar: CustomToolbar,
            month: {
              dateHeader: ({ label, date }) => {
                const dateStr = getDateKey(date);
                const count = datesCount[dateStr] || 0;
                const isStart = sameDay(date, startDate);
                const isEnd = sameDay(date, endDate);
                const outOfRange = date < startDateMinusTwo || date > endDate;
                const currentMonth = viewDate.getMonth();
                const isOutOfCurrentMonth = date.getMonth() !== currentMonth;
                const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0 es domingo y 6 es sábado
                const dateKey = getDateKey(date);
                const isExisting = existingDates.has(dateKey);




                let textColor = "black";
                let content = label;

                if (isStart) {
                  textColor = "white";
                  content = `SD - ${label}`;
                } else if (isEnd) {
                  textColor = "white";
                  content = `ED - ${label}`;
                } else if (isOutOfCurrentMonth) {
                  textColor = "#e6e6e6";
                  content = `${label}`;
                } else if (isExisting) {
                  textColor = "gray";
                  content = `${label} 🗓️`;
                } else if (outOfRange) {
                  textColor = "#e6e6e6";
                  content = `${label}`;
                } else if (isWeekend) {
                  textColor = "#e6e6e6";
                  content = `${label}`;
                }

                // Permitimos selección en StartDate y demás fechas no fuera de rango ni endDate, excluyendo días fuera del mes actual y fines de semana
                const canSelect = !isEnd && !outOfRange && !isOutOfCurrentMonth && !isWeekend;

                const style: IMyStyle = {
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  fontWeight: "bold",
                  color: textColor,
                };

                return (
                  <div style={style}>
                    {content}
                    {canSelect && (
                      <>
                        <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                          <button onClick={() => handleRemoveSelection(date)} disabled={count === 0}>
                            –
                          </button>
                          <button onClick={() => handleAddSelection(date)}>
                            +
                          </button>
                        </div>
                        {count > 0 && (
                          <div
                            style={{
                              fontSize: count > 2 ? "2.5em" : "1.5em",
                              color: "red",
                              fontWeight: "bold",
                            }}
                          >
                            {count > 2 ? count : "✔️ ".repeat(count).trim()}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              },
            },
          }}
        />
        <Calendar // para poder ver varias veces el mes, sacar de aqui el codigo
          localizer={localizer}
          events={[]}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700, width: "33.33%" }}
          date={moment(viewDate).add(1, 'month').toDate()}
          toolbar={true}
          view="month"
          dayPropGetter={getDayPropGetter(moment(viewDate).add(1, 'month').toDate().getMonth())}
          components={{
            toolbar: CustomToolbar,
            month: {
              dateHeader: ({ label, date }) => {
                const dateStr = getDateKey(date);
                const count = datesCount[dateStr] || 0;
                const isStart = sameDay(date, startDate);
                const isEnd = sameDay(date, endDate);
                const outOfRange = date < startDateMinusTwo || date > endDate;
                const currentMonth = moment(viewDate).add(1, 'month').toDate().getMonth();
                const isOutOfCurrentMonth = date.getMonth() !== currentMonth;
                const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0 es domingo y 6 es sábado
                const dateKey = getDateKey(date);
                const isExisting = existingDates.has(dateKey);




                let textColor = "black";
                let content = label;

                if (isStart) {
                  textColor = "white";
                  content = `SD - ${label}`;
                } else if (isEnd) {
                  textColor = "white";
                  content = `ED - ${label}`;
                } else if (isOutOfCurrentMonth) {
                  textColor = "#e6e6e6";
                  content = `${label}`;
                } else if (isExisting) {
                  textColor = "gray";
                  content = `${label} 🗓️`;
                } else if (outOfRange) {
                  textColor = "#e6e6e6";
                  content = `${label}`;
                } else if (isWeekend) {
                  textColor = "#e6e6e6";
                  content = `${label}`;
                }

                // Permitimos selección en StartDate y demás fechas no fuera de rango ni endDate, excluyendo días fuera del mes actual y fines de semana
                const canSelect = !isEnd && !outOfRange && !isOutOfCurrentMonth && !isWeekend;

                const style: IMyStyle = {
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  fontWeight: "bold",
                  color: textColor,
                };

                return (
                  <div style={style}>
                    {content}
                    {canSelect && (
                      <>
                        <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                          <button onClick={() => handleRemoveSelection(date)} disabled={count === 0}>
                            –
                          </button>
                          <button onClick={() => handleAddSelection(date)}>
                            +
                          </button>
                        </div>
                        {count > 0 && (
                          <div
                            style={{
                              fontSize: count > 2 ? "2.5em" : "1.5em",
                              color: "red",
                              fontWeight: "bold",
                            }}
                          >
                            {count > 2 ? count : "✔️ ".repeat(count).trim()}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              },
            },
          }}
        />
        {dayDifference > 31 && (
          <Calendar
            localizer={localizer}
            events={[]}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 700, width: "33.33%" }}
            date={moment(viewDate).add(2, 'month').toDate()}
            toolbar={true}
            view="month"
            dayPropGetter={getDayPropGetter(moment(viewDate).add(2, 'month').toDate().getMonth())}
            components={{
              toolbar: CustomToolbar,
              month: {
                dateHeader: ({ label, date }) => {
                  const dateStr = getDateKey(date);
                  const count = datesCount[dateStr] || 0;
                  const isStart = sameDay(date, startDate);
                  const isEnd = sameDay(date, endDate);
                  const outOfRange = date < startDateMinusTwo || date > endDate;
                  const currentMonth = moment(viewDate).add(2, 'month').toDate().getMonth();
                  const isOutOfCurrentMonth = date.getMonth() !== currentMonth;
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0 es domingo y 6 es sábado
                  const dateKey = getDateKey(date);
                  const isExisting = existingDates.has(dateKey);




                  let textColor = "black";
                  let content = label;

                  if (isStart) {
                    textColor = "white";
                    content = `SD - ${label}`;
                  } else if (isEnd) {
                    textColor = "white";
                    content = `ED - ${label}`;
                  } else if (isOutOfCurrentMonth) {
                    textColor = "#e6e6e6";
                    content = `${label}`;
                  } else if (isExisting) {
                    textColor = "gray";
                    content = `${label} 🗓️`;
                  } else if (outOfRange) {
                    textColor = "#e6e6e6";
                    content = `${label}`;
                  } else if (isWeekend) {
                    textColor = "#e6e6e6";
                    content = `${label}`;
                  }

                  // Permitimos selección en StartDate y demás fechas no fuera de rango ni endDate, excluyendo días fuera del mes actual y fines de semana
                  const canSelect = !isEnd && !outOfRange && !isOutOfCurrentMonth && !isWeekend;

                  const style: IMyStyle = {
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                    fontWeight: "bold",
                    color: textColor,
                  };

                  return (
                    <div style={style}>
                      {content}
                      {canSelect && (
                        <>
                          <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                            <button onClick={() => handleRemoveSelection(date)} disabled={count === 0}>
                              –
                            </button>
                            <button onClick={() => handleAddSelection(date)}>
                              +
                            </button>
                          </div>
                          {count > 0 && (
                            <div
                              style={{
                                fontSize: count > 2 ? "2.5em" : "1.5em",
                                color: "red",
                                fontWeight: "bold",
                              }}
                            >
                              {count > 2 ? count : "✔️ ".repeat(count).trim()}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                },
              },
            }}
          />
        )}
      </div>



      <button
        onClick={handlePrevMonth}
        style={{ ...buttonStyle, left: "10px" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#f0f0f0")
        }
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
      >
        <i className="fa fa-chevron-left"></i>
      </button>

      <button
        onClick={handleNextMonth}
        style={{ ...buttonStyle, right: "10px" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#f0f0f0")
        }
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
      >
        <i className="fa fa-chevron-right"></i>
      </button>

      <div style={{ marginTop: "20px" }}>
        <h3>
          Haz seleccionado {remaining} de {maxSelections} avisos:{" "}
        </h3>

        <ul>
          {formatDates(datesCount).map((dateStr, index) => {
            const dayName = moment(dateStr).format("dddd");
            return (
              <li key={index}>
                <span style={{ color: "blue", fontWeight: "bold" }}>
                  Ad {index + 1}:
                </span>{" "}
                {dateStr} - {dayName}
              </li>
            );
          })}
        </ul>
      </div>
      <button
        onClick={handleUpdatePayments}
        className="btn btn-primary overlay-button"
      >
        Update Date Ads
      </button>
    </div>
  );
};
