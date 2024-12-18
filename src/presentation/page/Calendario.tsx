import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useParams } from "react-router";
import { Payments } from "../../use-case/payments";
import { useState, useEffect } from "react";
import { IEvent } from "../../domain/event.type";

const localizer = momentLocalizer(moment);

export const Calendario = () => {
  const { id } = useParams();
  const [events, setEvents] = useState<IEvent[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [maxSelections, setMaxSelections] = useState<number>(0);

  useEffect(() => {
    const getDate = async () => {
      const data = await Payments.getPayments(id!);

      const events = [
        {
          title: "Start Date",
          start: new Date(data.calendario.dateStart),
          end: new Date(data.calendario.dateStart),
        },
        {
          title: "End Date",
          start: new Date(data.calendario.dateEnd),
          end: new Date(data.calendario.dateEnd),
        },
      ];

      setEvents(events);
      setMaxSelections(data.contador);
    };

    getDate();
  }, [id]);

  const handleSelectSlot = (slotInfo: { start: Date }) => {
    if (selectedDates.length < maxSelections) {
      const newDate = slotInfo.start;
      setSelectedDates((prevDates) => [...prevDates, newDate]);

      const newEvent = {
        title: "Selected Date",
        start: newDate,
        end: newDate,
      };

      setEvents((prevEvents) => [...prevEvents, newEvent]);
    } else {
      alert(`Solo puedes seleccionar ${maxSelections} fechas.`);
    }
  };

  const formatDates = (dates: Date[]) => {
    return dates.map((date) => moment(date).format("YYYY-MM-DD"));
  };

  const handleUpdatePayments = async () => {
    const formattedDates = formatDates(selectedDates);
    const data = await Payments.updatePayments(id!, formattedDates);
    console.log(data);
    alert("Fechas actualizadas con éxito!");
  };

  return (
    <div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        selectable
        onSelectSlot={handleSelectSlot}
      />
      <div>
        <h3>Fechas seleccionadas:</h3>
        <ul>
          {selectedDates.map((date, index) => (
            <li key={index}>{date.toString()}</li>
          ))}
        </ul>
      </div>
      <button onClick={handleUpdatePayments}>Actualizar Fechas</button>
    </div>
  );
};
