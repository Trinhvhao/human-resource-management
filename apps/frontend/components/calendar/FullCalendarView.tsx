'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import viLocale from '@fullcalendar/core/locales/vi';
import { EventClickArg, DateSelectArg, EventInput } from '@fullcalendar/core';

interface FullCalendarViewProps {
    events: EventInput[];
    onEventClick?: (info: EventClickArg) => void;
    onDateSelect?: (info: DateSelectArg) => void;
    onDateClick?: (date: Date) => void;
    editable?: boolean;
    selectable?: boolean;
    initialView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';
    height?: string | number;
    headerToolbar?: {
        left?: string;
        center?: string;
        right?: string;
    };
}

export default function FullCalendarView({
    events,
    onEventClick,
    onDateSelect,
    onDateClick,
    editable = false,
    selectable = true,
    initialView = 'dayGridMonth',
    height = 'auto',
    headerToolbar = {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    }
}: FullCalendarViewProps) {
    return (
        <div className="fullcalendar-wrapper">
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView={initialView}
                headerToolbar={headerToolbar}
                locale={viLocale}
                events={events}
                eventClick={onEventClick}
                select={onDateSelect}
                dateClick={(info) => onDateClick?.(info.date)}
                editable={editable}
                selectable={selectable}
                selectMirror={true}
                dayMaxEvents={3}
                weekends={true}
                height={height}
                slotMinTime="07:00:00"
                slotMaxTime="19:00:00"
                slotDuration="01:00:00"
                allDaySlot={false}
                nowIndicator={true}
                eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }}
                slotLabelFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }}
                buttonText={{
                    today: 'Hôm nay',
                    month: 'Tháng',
                    week: 'Tuần',
                    day: 'Ngày',
                    list: 'Danh sách'
                }}
                eventClassNames={(arg) => {
                    const type = arg.event.extendedProps.type;
                    return [`fc-event-${type}`];
                }}
            />
            <style jsx global>{`
                .fullcalendar-wrapper {
                    --fc-border-color: #e2e8f0;
                    --fc-button-bg-color: #3b82f6;
                    --fc-button-border-color: #3b82f6;
                    --fc-button-hover-bg-color: #2563eb;
                    --fc-button-hover-border-color: #2563eb;
                    --fc-button-active-bg-color: #1d4ed8;
                    --fc-button-active-border-color: #1d4ed8;
                    --fc-today-bg-color: #dbeafe;
                }

                .fc {
                    font-family: inherit;
                }

                .fc-toolbar-title {
                    font-size: 1.5rem !important;
                    font-weight: 700 !important;
                    color: #1e293b;
                }

                .fc-button {
                    text-transform: none !important;
                    font-weight: 600 !important;
                    padding: 0.5rem 1rem !important;
                    border-radius: 0.5rem !important;
                }

                .fc-daygrid-day-number {
                    font-weight: 600;
                    color: #475569;
                }

                .fc-col-header-cell-cushion {
                    font-weight: 700;
                    color: #1e293b;
                    padding: 0.75rem 0;
                }

                /* Event colors by type */
                .fc-event-work {
                    background-color: #3b82f6 !important;
                    border-color: #2563eb !important;
                }

                .fc-event-leave {
                    background-color: #f97316 !important;
                    border-color: #ea580c !important;
                }

                .fc-event-overtime {
                    background-color: #a855f7 !important;
                    border-color: #9333ea !important;
                }

                .fc-event-holiday {
                    background-color: #ef4444 !important;
                    border-color: #dc2626 !important;
                }

                .fc-event {
                    cursor: pointer;
                    border-radius: 0.25rem;
                    padding: 2px 4px;
                }

                .fc-event:hover {
                    opacity: 0.9;
                }

                .fc-daygrid-event {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .fc-timegrid-event {
                    border-radius: 0.25rem;
                }

                .fc-list-event:hover td {
                    background-color: #f1f5f9;
                }

                .fc-day-today {
                    background-color: var(--fc-today-bg-color) !important;
                }

                .fc-scrollgrid {
                    border-radius: 0.5rem;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}
