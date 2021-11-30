import React from 'react'
import { render, cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import FullCalendar from '../dist/main'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import interactionPlugin from '@fullcalendar/interaction'
import uuid from 'uuid'

if(!Date.prototype.addHours) {
  Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
  }
}

if (!Date.prototype.toISOString) {
  (function() {
    function pad(number) {
      var r = String(number);
      if (r.length === 1) {
        r = '0' + r;
      }
      return r;
    }
    Date.prototype.toISOString = function() {
      return this.getUTCFullYear() +
        '-' + pad(this.getUTCMonth() + 1) +
        '-' + pad(this.getUTCDate()) +
        'T' + pad(this.getUTCHours()) +
        ':' + pad(this.getUTCMinutes()) +
        ':' + pad(this.getUTCSeconds())
    };
  }());
}

const NOW_DATE = new Date()

const addHoursAndGetISOString = (hours) => {
  return NOW_DATE.addHours(hours).toISOString()
}

const resource01 = 'a59b98d6-3a5d-492f-95eb-d8b9b51d7817'
const resource02 = 'f1a3ed14-93ae-4090-9228-781734f64a5f'

const eventId = '42ac857c-6836-4419-95d8-f37c364c9f38'

const resources = [
  {
    id: resource01,
    title: 'Elliot'
  },
  {
    id: resource02,
    title: 'Billie'
  }
]

const initialEvents = [
  {
    id: eventId,
    resourceId: resource01,
    start: addHoursAndGetISOString(2),
    end: addHoursAndGetISOString(6),
    title: 'An event to be drawn in the calendar timeline',
    editable: true,
    resourceEditable: true
  }
]

const moveEventToResource = (event, lane) => {
  fireEvent.dragStart(event)
  fireEvent.dragEnter(lane)
  fireEvent.dragOver(lane)
  fireEvent.drop(lane)
}

const MockedFullCalendar = () => {
  const calendarRef = React.createRef()
  const [events, setEvents] = React.useState(initialEvents)

  const handleEventDrop = (eventDropArgs) => {
    console.log('eventDrop is also important to work during tests')
    if (eventDropArgs && eventDropArgs.event.start && eventDropArgs.event.end) {
      const mappedEvents = events.map(event => {
        if (event.id === eventDropArgs.event.id) {
          return {
            ...event,
            start: eventDropArgs.event.start,
            end: eventDropArgs.event.end,
            resourceId: eventDropArgs.event.getResources()[0].id
          }
        }
        return event
      })
      setEvents(mappedEvents)
    }
  }

  const handleEventResize = (eventResizeDoneArgs) => {
    console.log('eventResize is important to work during tests')

    if (eventResizeDoneArgs && eventResizeDoneArgs.event.start && eventResizeDoneArgs.event.end) {
      const mappedEvents = events.map(event => {
        if (event.id === eventResizeDoneArgs.event.id) {
          return {
            ...event,
            start: eventResizeDoneArgs.event.start,
            end: eventResizeDoneArgs.event.end,
            resourceId: eventResizeDoneArgs.event.getResources()[0].id
          }
        }
        return event
      })
      setEvents(mappedEvents)
    }
  }

  const handleAddNewEvent = (dateSelectArgs) => {
    console.log('select is important to work during tests')
    if (dateSelectArgs.resource) {
      setEvents([
        ...events,
        {
          id: uuid(),
          resourceId: dateSelectArgs.resource?._resource.id,
          start: dateSelectArgs.startStr,
          end: dateSelectArgs.endStr,
          title: 'A new event to be drawn'
        }
      ])
    }
  }

  return (
    <FullCalendar
      ref={calendarRef}
      schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
      plugins={[resourceTimelinePlugin, interactionPlugin]}
      initialView="resourceTimeline"
      resources={resources}
      events={events}
      initialDate={NOW_DATE}
      headerToolbar={false}
      handleWindowResize
      editable
      eventResourceEditable
      selectable
      viewDidMount={() => {
        console.log('viewDidMount seems to be working during tests')
      }}
      eventContent={(eventArgs) => {
        console.log('eventContent seems to be working during tests')
        return (
          <div data-test-id={`event-${eventArgs.event.id}-resource-${eventArgs.event.getResources()[0].id}`}>
            <div>{eventArgs.event.title}</div>
          </div>
        )
      }}
      // Callbacks whom are not working during testes
      eventDrop={handleEventDrop}
      eventResize={handleEventResize}
      select={handleAddNewEvent}
    />
  )
}


describe('when dragging and dropping', () => {
  afterEach(() => cleanup())

  it('should execute callback functions', async () => {

    const result = render(<MockedFullCalendar />)

    const event = await result.findByTestId(`event-${eventId}-resource-${resource01}`)

    const lanes = result.container.querySelectorAll(`td[data-resource-id=${resource02}]`)

    // This event should trigger the eventDrop callback. And the issue with the
    // other callbacks is that might be the same even though I am not reproducing
    // here.
    if (lanes.length === 2) {
      await waitFor(() => moveEventToResource(event, lanes[1]))
    }

    // This will output the current DOM during test execution (it's pretty handy btw)
    screen.logTestingPlaygroundURL()

    const eventNewLocation = await result.findByTestId(`event-${eventId}-resource-${resource02}`)

    expect(eventNewLocation).toBeInTheDocument()
  })
})
