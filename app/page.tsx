"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Plus, Search, Settings, Menu, Pause, Sparkles, X, GripVertical } from "lucide-react"
import CreateEventModal from "@/components/create-event-modal"

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [showAIPopup, setShowAIPopup] = useState(false)
  const [typedText, setTypedText] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const calendarRef = useRef(null)
  const [draggedEvent, setDraggedEvent] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dropPreview, setDropPreview] = useState(null)
  const ghostRef = useRef(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createInitialDay, setCreateInitialDay] = useState(1)
  const [createInitialTime, setCreateInitialTime] = useState("09:00")
  const [editingEvent, setEditingEvent] = useState(null)

  useEffect(() => {
    setIsLoaded(true)

    // Show AI popup after 3 seconds
    const popupTimer = setTimeout(() => {
      setShowAIPopup(true)
    }, 3000)

    return () => clearTimeout(popupTimer)
  }, [])

  useEffect(() => {
    if (showAIPopup) {
      const text =
        "LLooks like you don't have that many meetings today. Shall I play some Hans Zimmer essentials to help you get into your Flow State?"
      let i = 0
      const typingInterval = setInterval(() => {
        if (i < text.length) {
          setTypedText((prev) => prev + text.charAt(i))
          i++
        } else {
          clearInterval(typingInterval)
        }
      }, 50)

      return () => clearInterval(typingInterval)
    }
  }, [showAIPopup])

  // Effect to handle mouse movement for custom drag ghost
  useEffect(() => {
    if (!draggedEvent) return

    const handleMouseMove = (e) => {
      if (ghostRef.current) {
        ghostRef.current.style.left = `${e.clientX - dragOffset.x}px`
        ghostRef.current.style.top = `${e.clientY - dragOffset.y}px`
      }

      // Update drop preview if calendar ref exists
      if (calendarRef.current) {
        const calendarRect = calendarRef.current.getBoundingClientRect()

        // Get the time column width (first column)
        const timeColumnWidth = calendarRect.width / 8

        // Check if mouse is within calendar bounds (excluding time column)
        if (
          e.clientX >= calendarRect.left + timeColumnWidth &&
          e.clientX <= calendarRect.right &&
          e.clientY >= calendarRect.top &&
          e.clientY <= calendarRect.bottom
        ) {
          // Calculate day column (0-6)
          const dayWidth = (calendarRect.width - timeColumnWidth) / 7
          const dayIndex = Math.floor((e.clientX - (calendarRect.left + timeColumnWidth)) / dayWidth)
          const newDay = Math.max(0, Math.min(6, dayIndex)) + 1

          // Calculate time based on y position
          const relativeY = e.clientY - calendarRect.top
          const timeHeight = 80 // 80px per hour
          const hourOffset = Math.floor(relativeY / timeHeight)
          const minuteOffset = Math.round((relativeY % timeHeight) / (timeHeight / 60))
          const snappedMinuteOffset = Math.floor(minuteOffset / 15) * 15

          // Calculate new start time (8:00 AM is the first slot)
          let startHour = 8 + hourOffset
          let startMinute = snappedMinuteOffset

          // Ensure time is within bounds (8 AM - 4 PM)
          startHour = Math.max(8, Math.min(16, startHour))
          if (startHour === 16) startMinute = 0 // Cap at 4:00 PM

          // Format the new start time
          const newStartTime = `${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}`

          // Calculate duration of the event in minutes
          const startParts = draggedEvent.startTime.split(":")
          const endParts = draggedEvent.endTime.split(":")
          const startMinutes = Number.parseInt(startParts[0]) * 60 + Number.parseInt(startParts[1])
          const endMinutes = Number.parseInt(endParts[0]) * 60 + Number.parseInt(endParts[1])
          const durationMinutes = endMinutes - startMinutes

          // Calculate new end time
          const newStartMinutes = startHour * 60 + startMinute
          const newEndMinutes = Math.min(16 * 60, newStartMinutes + durationMinutes) // Cap at 4:00 PM
          const newEndHour = Math.floor(newEndMinutes / 60)
          const newEndMinute = newEndMinutes % 60

          // Format the new end time
          const newEndTime = `${newEndHour.toString().padStart(2, "0")}:${newEndMinute.toString().padStart(2, "0")}`

          // Update drop preview
          setDropPreview({
            day: newDay,
            startTime: newStartTime,
            endTime: newEndTime,
            color: draggedEvent.color,
          })
        } else {
          // Mouse is outside calendar bounds
          setDropPreview(null)
        }
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [draggedEvent, dragOffset])

  const [currentView, setCurrentView] = useState("week")
  const [currentMonth, setCurrentMonth] = useState("March 2025")
  const [currentDate, setCurrentDate] = useState("March 5")
  const [selectedEvent, setSelectedEvent] = useState(null)

  const handleEventClick = (event, e) => {
    // Prevent click when dragging
    if (draggedEvent) return
    e.stopPropagation()
    setSelectedEvent(event)
    // Open the event in edit mode
    setCreateInitialDay(event.day)
    setCreateInitialTime(event.startTime)
    setEditingEvent(event)
    setShowCreateModal(true)
  }

  // Updated sample calendar events with all events before 4 PM
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Team Meeting",
      startTime: "09:00",
      endTime: "10:00",
      color: "bg-blue-500",
      day: 1,
      description: "Weekly team sync-up",
      location: "Conference Room A",
      attendees: ["John Doe", "Jane Smith", "Bob Johnson"],
      organizer: "Alice Brown",
    },
    {
      id: 2,
      title: "Lunch with Sarah",
      startTime: "12:30",
      endTime: "13:30",
      color: "bg-green-500",
      day: 1,
      description: "Discuss project timeline",
      location: "Cafe Nero",
      attendees: ["Sarah Lee"],
      organizer: "You",
    },
    {
      id: 3,
      title: "Project Review",
      startTime: "14:00",
      endTime: "15:30",
      color: "bg-purple-500",
      day: 3,
      description: "Q2 project progress review",
      location: "Meeting Room 3",
      attendees: ["Team Alpha", "Stakeholders"],
      organizer: "Project Manager",
    },
    {
      id: 4,
      title: "Client Call",
      startTime: "10:00",
      endTime: "11:00",
      color: "bg-yellow-500",
      day: 2,
      description: "Quarterly review with major client",
      location: "Zoom Meeting",
      attendees: ["Client Team", "Sales Team"],
      organizer: "Account Manager",
    },
    {
      id: 5,
      title: "Team Brainstorm",
      startTime: "13:00",
      endTime: "14:30",
      color: "bg-indigo-500",
      day: 4,
      description: "Ideation session for new product features",
      location: "Creative Space",
      attendees: ["Product Team", "Design Team"],
      organizer: "Product Owner",
    },
    {
      id: 6,
      title: "Product Demo",
      startTime: "11:00",
      endTime: "12:00",
      color: "bg-pink-500",
      day: 5,
      description: "Showcase new features to stakeholders",
      location: "Demo Room",
      attendees: ["Stakeholders", "Dev Team"],
      organizer: "Tech Lead",
    },
    {
      id: 7,
      title: "Marketing Meeting",
      startTime: "13:00",
      endTime: "14:00",
      color: "bg-teal-500",
      day: 6,
      description: "Discuss Q3 marketing strategy",
      location: "Marketing Office",
      attendees: ["Marketing Team"],
      organizer: "Marketing Director",
    },
    {
      id: 8,
      title: "Code Review",
      startTime: "15:00",
      endTime: "16:00",
      color: "bg-cyan-500",
      day: 7,
      description: "Review pull requests for new feature",
      location: "Dev Area",
      attendees: ["Dev Team"],
      organizer: "Senior Developer",
    },
    {
      id: 9,
      title: "Morning Standup",
      startTime: "08:30",
      endTime: "09:30", // Changed from "09:00" to "09:30"
      color: "bg-blue-400",
      day: 2,
      description: "Daily team standup",
      location: "Slack Huddle",
      attendees: ["Development Team"],
      organizer: "Scrum Master",
    },
    {
      id: 10,
      title: "Design Review",
      startTime: "14:30",
      endTime: "15:45",
      color: "bg-purple-400",
      day: 5,
      description: "Review new UI designs",
      location: "Design Lab",
      attendees: ["UX Team", "Product Manager"],
      organizer: "Lead Designer",
    },
    {
      id: 11,
      title: "Investor Meeting",
      startTime: "10:30",
      endTime: "12:00",
      color: "bg-red-400",
      day: 7,
      description: "Quarterly investor update",
      location: "Board Room",
      attendees: ["Executive Team", "Investors"],
      organizer: "CEO",
    },
    {
      id: 12,
      title: "Team Training",
      startTime: "09:30",
      endTime: "11:30",
      color: "bg-green-400",
      day: 4,
      description: "New tool onboarding session",
      location: "Training Room",
      attendees: ["All Departments"],
      organizer: "HR",
    },
    {
      id: 13,
      title: "Budget Review",
      startTime: "13:30",
      endTime: "15:00",
      color: "bg-yellow-400",
      day: 3,
      description: "Quarterly budget analysis",
      location: "Finance Office",
      attendees: ["Finance Team", "Department Heads"],
      organizer: "CFO",
    },
    {
      id: 14,
      title: "Client Presentation",
      startTime: "11:00",
      endTime: "12:30",
      color: "bg-orange-400",
      day: 6,
      description: "Present new project proposal",
      location: "Client Office",
      attendees: ["Sales Team", "Client Representatives"],
      organizer: "Account Executive",
    },
    {
      id: 15,
      title: "Product Planning",
      startTime: "14:00",
      endTime: "15:30",
      color: "bg-pink-400",
      day: 1,
      description: "Roadmap discussion for Q3",
      location: "Strategy Room",
      attendees: ["Product Team", "Engineering Leads"],
      organizer: "Product Manager",
    },
  ])

  // Sample calendar days for the week view
  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
  const weekDates = [3, 4, 5, 6, 7, 8, 9]
  const timeSlots = Array.from({ length: 9 }, (_, i) => i + 8) // 8 AM to 4 PM

  // Helper function to calculate event position and height
  const calculateEventStyle = (startTime, endTime) => {
    const start = Number.parseInt(startTime.split(":")[0]) + Number.parseInt(startTime.split(":")[1]) / 60
    const end = Number.parseInt(endTime.split(":")[0]) + Number.parseInt(endTime.split(":")[1]) / 60
    const top = (start - 8) * 80 // 80px per hour
    const height = (end - start) * 80
    return { top: `${top}px`, height: `${height}px` }
  }

  // Sample calendar for mini calendar
  const daysInMonth = 31
  const firstDayOffset = 5 // Friday is the first day of the month in this example
  const miniCalendarDays = Array.from({ length: daysInMonth + firstDayOffset }, (_, i) =>
    i < firstDayOffset ? null : i - firstDayOffset + 1,
  )

  // Sample my calendars
  const myCalendars = [
    { name: "My Calendar", color: "bg-blue-500" },
    { name: "Work", color: "bg-green-500" },
    { name: "Personal", color: "bg-purple-500" },
    { name: "Family", color: "bg-orange-500" },
  ]

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    // Here you would typically also control the actual audio playback
  }

  // Custom drag and drop handlers
  const handleDragStart = (e, event) => {
    e.preventDefault() // Prevent default HTML5 drag behavior
    e.stopPropagation()

    // Get the position of the click relative to the event element
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    setDragOffset({ x: offsetX, y: offsetY })
    setDraggedEvent(event)

    // Create a clone of the event element for the ghost
    const eventElement = e.currentTarget
    const ghost = eventElement.cloneNode(true)

    // Style the ghost element
    ghost.style.position = "fixed"
    ghost.style.left = `${e.clientX - offsetX}px`
    ghost.style.top = `${e.clientY - offsetY}px`
    ghost.style.width = `${eventElement.offsetWidth}px`
    ghost.style.height = `${eventElement.offsetHeight}px`
    ghost.style.pointerEvents = "none"
    ghost.style.zIndex = "9999"
    ghost.style.opacity = "0.8"
    ghost.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)"
    ghost.style.transition = "none" // Remove any transitions
    ghost.classList.add("react-draggable") // Add class for styling

    // Add the ghost to the document body
    document.body.appendChild(ghost)
    ghostRef.current = ghost
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()

    if (!draggedEvent || !dropPreview) {
      cleanupDrag()
      return
    }

    // Update the event with the preview data
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === draggedEvent.id
          ? {
              ...event,
              day: dropPreview.day,
              startTime: dropPreview.startTime,
              endTime: dropPreview.endTime,
            }
          : event,
      ),
    )

    cleanupDrag()
  }

  const handleDragEnd = () => {
    cleanupDrag()
  }

  const cleanupDrag = () => {
    // Remove ghost element
    if (ghostRef.current) {
      document.body.removeChild(ghostRef.current)
      ghostRef.current = null
    }

    // Reset state
    setDraggedEvent(null)
    setDropPreview(null)
  }

  // Handle mouse up anywhere to end drag
  useEffect(() => {
    const handleMouseUp = () => {
      if (draggedEvent && dropPreview) {
        // Update the event with the preview data
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === draggedEvent.id
              ? {
                  ...event,
                  day: dropPreview.day,
                  startTime: dropPreview.startTime,
                  endTime: dropPreview.endTime,
                }
              : event,
          ),
        )
      }

      cleanupDrag()
    }

    window.addEventListener("mouseup", handleMouseUp)
    return () => window.removeEventListener("mouseup", handleMouseUp)
  }, [draggedEvent, dropPreview])

  // Handle time slot click to create a new event
  const handleTimeSlotClick = (dayIndex, timeIndex) => {
    // Don't create event if we're dragging
    if (draggedEvent) return

    // Calculate the time for the clicked slot
    const hour = timeIndex + 8 // 8 AM is the first slot

    // Ensure the hour is within valid range (8 AM to 4 PM)
    const validHour = Math.max(8, Math.min(16, hour))
    const startTime = `${validHour.toString().padStart(2, "0")}:00`

    setCreateInitialDay(dayIndex + 1)
    setCreateInitialTime(startTime)
    setEditingEvent(null) // Ensure we're not in edit mode
    setShowCreateModal(true)
  }

  // Handle create event button click
  const handleCreateEventClick = () => {
    setCreateInitialDay(1) // Default to Sunday
    setCreateInitialTime("09:00") // Default to 9 AM
    setEditingEvent(null) // Ensure we're not in edit mode
    setShowCreateModal(true)
  }

  // Handle save event from modal
  const handleSaveEvent = (eventData) => {
    if (editingEvent) {
      // Update existing event
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === editingEvent.id
            ? {
                ...eventData,
                id: event.id, // Preserve the original ID
              }
            : event,
        ),
      )
    } else {
      // Create new event
      // Generate a unique ID for the new event
      const newId = Math.max(...events.map((e) => e.id), 0) + 1

      // Create the base event
      const baseEvent = {
        ...eventData,
        id: newId,
      }

      // If this is a repeating event, create multiple events
      if (eventData.repeatOption !== "none" && eventData.repeatUntil) {
        const repeatingEvents = generateRepeatingEvents(baseEvent)
        setEvents((prev) => [...prev, ...repeatingEvents])
      } else {
        // Just add the single event
        setEvents((prev) => [...prev, baseEvent])
      }
    }

    // Reset editing state
    setEditingEvent(null)
  }

  // Generate repeating events based on the repeat pattern
  const generateRepeatingEvents = (baseEvent) => {
    const events = []
    const today = new Date()
    const endDate = new Date(baseEvent.repeatUntil)

    // Add the first occurrence
    events.push({ ...baseEvent })

    // For simplicity, we'll just simulate a few occurrences based on the repeat pattern
    // In a real app, you'd generate all occurrences up to the end date

    if (baseEvent.repeatOption === "daily") {
      // Add daily occurrences (up to 10 for demo purposes)
      for (let i = 1; i <= 10; i++) {
        if (events.length >= 10) break // Limit to 10 events for demo

        const newDay = ((baseEvent.day + i * baseEvent.repeatFrequency - 1) % 7) + 1
        events.push({
          ...baseEvent,
          id: baseEvent.id + i,
          day: newDay,
        })
      }
    } else if (baseEvent.repeatOption === "weekdays") {
      // Add weekday occurrences (Monday-Friday)
      for (let i = 1; i <= 10; i++) {
        if (events.length >= 10) break // Limit to 10 events for demo

        const newDay = ((baseEvent.day + i - 1) % 7) + 1
        // Only add if it's a weekday (2-6 are Monday-Friday in our system)
        if (newDay >= 2 && newDay <= 6) {
          events.push({
            ...baseEvent,
            id: baseEvent.id + i,
            day: newDay,
          })
        }
      }
    } else if (baseEvent.repeatOption === "weekly") {
      // Add weekly occurrences on the specified days
      if (baseEvent.repeatOn.length > 0) {
        for (let i = 0; i < 10; i++) {
          if (events.length >= 10) break // Limit to 10 events for demo

          // Add events for each selected day of the week
          for (const dayOfWeek of baseEvent.repeatOn) {
            events.push({
              ...baseEvent,
              id: baseEvent.id + events.length,
              day: dayOfWeek + 1, // Convert 0-6 to 1-7
            })
          }
        }
      }
    }

    // Remove the first event if it's a duplicate of the base event
    if (events.length > 1 && events[0].day === events[1].day) {
      events.shift()
    }

    return events
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <Image
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop"
        alt="Beautiful mountain landscape"
        fill
        className="object-cover"
        priority
      />

      {/* Navigation */}
      <header
        className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-6 opacity-0 ${isLoaded ? "animate-fade-in" : ""}`}
        style={{ animationDelay: "0.2s" }}
      >
        <div className="flex items-center gap-4">
          <Menu className="h-6 w-6 text-white" />
          <span className="text-2xl font-semibold text-white drop-shadow-lg">Calendar</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
            <input
              type="text"
              placeholder="Search"
              className="rounded-full bg-white/10 backdrop-blur-sm pl-10 pr-4 py-2 text-white placeholder:text-white/70 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <Settings className="h-6 w-6 text-white drop-shadow-md" />
          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-md">
            U
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative h-screen w-full pt-20 flex">
        {/* Sidebar */}
        <div
          className={`w-64 h-full bg-white/10 backdrop-blur-lg p-4 shadow-xl border-r border-white/20 rounded-tr-3xl opacity-0 ${isLoaded ? "animate-fade-in" : ""} flex flex-col justify-between`}
          style={{ animationDelay: "0.4s" }}
        >
          <div>
            <button
              className="mb-6 flex items-center justify-center gap-2 rounded-full bg-blue-500 px-4 py-3 text-white w-full"
              onClick={handleCreateEventClick}
            >
              <Plus className="h-5 w-5" />
              <span>Create</span>
            </button>

            {/* Mini Calendar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">{currentMonth}</h3>
                <div className="flex gap-1">
                  <button className="p-1 rounded-full hover:bg-white/20">
                    <ChevronLeft className="h-4 w-4 text-white" />
                  </button>
                  <button className="p-1 rounded-full hover:bg-white/20">
                    <ChevronRight className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                  <div key={i} className="text-xs text-white/70 font-medium py-1">
                    {day}
                  </div>
                ))}

                {miniCalendarDays.map((day, i) => (
                  <div
                    key={i}
                    className={`text-xs rounded-full w-7 h-7 flex items-center justify-center ${
                      day === 5 ? "bg-blue-500 text-white" : "text-white hover:bg-white/20"
                    } ${!day ? "invisible" : ""}`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* My Calendars */}
            <div>
              <h3 className="text-white font-medium mb-3">My calendars</h3>
              <div className="space-y-2">
                {myCalendars.map((cal, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-sm ${cal.color}`}></div>
                    <span className="text-white text-sm">{cal.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* New position for the big plus button */}
          <button
            className="mt-6 flex items-center justify-center gap-2 rounded-full bg-blue-500 p-4 text-white w-14 h-14 self-start"
            onClick={handleCreateEventClick}
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {/* Calendar View */}
        <div
          className={`flex-1 flex flex-col opacity-0 ${isLoaded ? "animate-fade-in" : ""}`}
          style={{ animationDelay: "0.6s" }}
        >
          {/* Calendar Controls */}
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 text-white bg-blue-500 rounded-md">Today</button>
              <div className="flex">
                <button className="p-2 text-white hover:bg-white/10 rounded-l-md">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button className="p-2 text-white hover:bg-white/10 rounded-r-md">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <h2 className="text-xl font-semibold text-white">{currentDate}</h2>
            </div>

            <div className="flex items-center gap-2 rounded-md p-1">
              <button
                onClick={() => setCurrentView("day")}
                className={`px-3 py-1 rounded ${currentView === "day" ? "bg-white/20" : ""} text-white text-sm`}
              >
                Day
              </button>
              <button
                onClick={() => setCurrentView("week")}
                className={`px-3 py-1 rounded ${currentView === "week" ? "bg-white/20" : ""} text-white text-sm`}
              >
                Week
              </button>
              <button
                onClick={() => setCurrentView("month")}
                className={`px-3 py-1 rounded ${currentView === "month" ? "bg-white/20" : ""} text-white text-sm`}
              >
                Month
              </button>
            </div>
          </div>

          {/* Week View */}
          <div className="flex-1 overflow-auto p-4">
            <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl h-full">
              {/* Week Header */}
              <div className="grid grid-cols-8 border-b border-white/20">
                <div className="p-2 text-center text-white/50 text-xs"></div>
                {weekDays.map((day, i) => (
                  <div key={i} className="p-2 text-center border-l border-white/20">
                    <div className="text-xs text-white/70 font-medium">{day}</div>
                    <div
                      className={`text-lg font-medium mt-1 text-white ${weekDates[i] === 5 ? "bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center mx-auto" : ""}`}
                    >
                      {weekDates[i]}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Grid */}
              <div className="grid grid-cols-8" ref={calendarRef}>
                {/* Time Labels */}
                <div className="text-white/70">
                  {timeSlots.map((time, i) => (
                    <div key={i} className="h-20 border-b border-white/10 pr-2 text-right text-xs">
                      {time > 12 ? `${time - 12} PM` : `${time} AM`}
                    </div>
                  ))}
                </div>

                {/* Days Columns */}
                {Array.from({ length: 7 }).map((_, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="border-l border-white/20 relative"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {timeSlots.map((_, timeIndex) => (
                      <div
                        key={timeIndex}
                        className="h-20 border-b border-white/10 cursor-pointer hover:bg-white/5"
                        onClick={() => handleTimeSlotClick(dayIndex, timeIndex)}
                      ></div>
                    ))}

                    {/* Drop Preview */}
                    {dropPreview && dropPreview.day === dayIndex + 1 && (
                      <div
                        className={`absolute ${dropPreview.color.replace("bg-", "bg-opacity-50 bg-")} border-2 border-dashed border-white rounded-md p-2 text-white text-xs shadow-md`}
                        style={{
                          ...calculateEventStyle(dropPreview.startTime, dropPreview.endTime),
                          left: "4px",
                          right: "4px",
                          zIndex: 5,
                        }}
                      >
                        <div className="font-medium">{draggedEvent?.title}</div>
                        <div className="opacity-80 text-[10px] mt-1">{`${dropPreview.startTime} - ${dropPreview.endTime}`}</div>
                      </div>
                    )}

                    {/* Events */}
                    {events
                      .filter((event) => event.day === dayIndex + 1)
                      .map((event) => {
                        const eventStyle = calculateEventStyle(event.startTime, event.endTime)
                        return (
                          <div
                            key={event.id}
                            className={`absolute ${event.color} rounded-md p-2 text-white text-xs shadow-md cursor-move transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:shadow-lg ${draggedEvent?.id === event.id ? "opacity-0" : ""}`}
                            style={{
                              ...eventStyle,
                              left: "4px",
                              right: "4px",
                              zIndex: 10,
                            }}
                            onMouseDown={(e) => handleDragStart(e, event)}
                            onClick={(e) => handleEventClick(event, e)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{event.title}</div>
                              <GripVertical className="h-3 w-3 opacity-70" />
                            </div>
                            <div className="opacity-80 text-[10px] mt-1">{`${event.startTime} - ${event.endTime}`}</div>
                          </div>
                        )
                      })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Popup */}
        {showAIPopup && (
          <div className="fixed bottom-8 right-8 z-20">
            <div className="w-[450px] relative bg-gradient-to-br from-blue-400/30 via-blue-500/30 to-blue-600/30 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-blue-300/30 text-white">
              <button
                onClick={() => setShowAIPopup(false)}
                className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-blue-300" />
                </div>
                <div className="min-h-[80px]">
                  <p className="text-base font-light">{typedText}</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={togglePlay}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors font-medium"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowAIPopup(false)}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors font-medium"
                >
                  No
                </button>
              </div>
              {isPlaying && (
                <div className="mt-4 flex items-center justify-between">
                  <button
                    className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-white text-sm hover:bg-white/20 transition-colors"
                    onClick={togglePlay}
                  >
                    <Pause className="h-4 w-4" />
                    <span>Pause Hans Zimmer</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Event Modal */}
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setEditingEvent(null) // Clear editing state when closing modal
          }}
          onSave={handleSaveEvent}
          initialDay={createInitialDay}
          initialTime={createInitialTime}
          editingEvent={editingEvent} // Pass the editing event to the modal
        />
      </main>
    </div>
  )
}
