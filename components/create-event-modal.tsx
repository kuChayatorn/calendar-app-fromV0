"use client"

import { useState, useEffect } from "react"
import { X, Calendar, Clock, MapPin, Users, Repeat, Info } from "lucide-react"

const colorOptions = [
  { name: "Blue", value: "bg-blue-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Red", value: "bg-red-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Teal", value: "bg-teal-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Cyan", value: "bg-cyan-500" },
]

const repeatOptions = [
  { id: "none", label: "Does not repeat" },
  { id: "daily", label: "Daily" },
  { id: "weekdays", label: "Every weekday (Monday to Friday)" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
  { id: "custom", label: "Custom..." },
]

export default function CreateEventModal({
  isOpen,
  onClose,
  onSave,
  initialDay = 1,
  initialTime = "09:00",
  editingEvent = null,
}) {
  const [eventData, setEventData] = useState({
    title: "",
    startTime: initialTime,
    endTime: calculateEndTime(initialTime, 60), // Default 1 hour duration
    day: initialDay,
    color: "bg-blue-500",
    location: "",
    description: "",
    attendees: [],
    organizer: "You",
    repeatOption: "none",
    repeatUntil: "",
    repeatFrequency: 1,
    repeatOn: [], // For weekly: [0, 1, 2, 3, 4, 5, 6] where 0 is Sunday
  })

  const [attendeeInput, setAttendeeInput] = useState("")
  const [showRepeatOptions, setShowRepeatOptions] = useState(false)
  const [errors, setErrors] = useState({})

  // Reset form when modal opens with initial values
  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        // If editing an existing event, populate the form with its data
        setEventData({
          title: editingEvent.title || "",
          startTime: editingEvent.startTime || initialTime,
          endTime: editingEvent.endTime || calculateEndTime(initialTime, 60),
          day: editingEvent.day || initialDay,
          color: editingEvent.color || "bg-blue-500",
          location: editingEvent.location || "",
          description: editingEvent.description || "",
          attendees: editingEvent.attendees || [],
          organizer: editingEvent.organizer || "You",
          repeatOption: editingEvent.repeatOption || "none",
          repeatUntil: editingEvent.repeatUntil || "",
          repeatFrequency: editingEvent.repeatFrequency || 1,
          repeatOn: editingEvent.repeatOn || [],
        })
        setShowRepeatOptions(editingEvent.repeatOption !== "none")
      } else {
        // If creating a new event, use the initial values
        setEventData({
          title: "",
          startTime: initialTime,
          endTime: calculateEndTime(initialTime, 60),
          day: initialDay,
          color: "bg-blue-500",
          location: "",
          description: "",
          attendees: [],
          organizer: "You",
          repeatOption: "none",
          repeatUntil: "",
          repeatFrequency: 1,
          repeatOn: [],
        })
      }
      setAttendeeInput("")
      setErrors({})
    }
  }, [isOpen, initialDay, initialTime, editingEvent])

  // Helper function to calculate end time based on start time and duration in minutes
  function calculateEndTime(startTime, durationMinutes) {
    const [hours, minutes] = startTime.split(":").map(Number)
    const totalMinutes = hours * 60 + minutes + durationMinutes
    const newHours = Math.floor(totalMinutes / 60)
    const newMinutes = totalMinutes % 60
    return `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`
  }

  // Update end time when start time changes to maintain duration
  useEffect(() => {
    const [startHours, startMinutes] = eventData.startTime.split(":").map(Number)
    const [endHours, endMinutes] = eventData.endTime.split(":").map(Number)

    const startTotalMinutes = startHours * 60 + startMinutes
    const endTotalMinutes = endHours * 60 + endMinutes
    const duration = endTotalMinutes - startTotalMinutes

    if (duration > 0) {
      setEventData((prev) => ({
        ...prev,
        endTime: calculateEndTime(prev.startTime, duration),
      }))
    }
  }, [eventData.startTime])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEventData((prev) => ({ ...prev, [name]: value }))

    // Clear error when field is updated
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleColorChange = (color) => {
    setEventData((prev) => ({ ...prev, color }))
  }

  const handleRepeatChange = (e) => {
    const value = e.target.value
    setEventData((prev) => ({ ...prev, repeatOption: value }))
    setShowRepeatOptions(value !== "none")

    // Set default repeat until date (2 weeks from now)
    if (value !== "none" && !eventData.repeatUntil) {
      const twoWeeksFromNow = new Date()
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14)
      const formattedDate = twoWeeksFromNow.toISOString().split("T")[0]
      setEventData((prev) => ({ ...prev, repeatUntil: formattedDate }))
    }
  }

  const handleAddAttendee = () => {
    if (attendeeInput.trim()) {
      setEventData((prev) => ({
        ...prev,
        attendees: [...prev.attendees, attendeeInput.trim()],
      }))
      setAttendeeInput("")
    }
  }

  const handleRemoveAttendee = (index) => {
    setEventData((prev) => ({
      ...prev,
      attendees: prev.attendees.filter((_, i) => i !== index),
    }))
  }

  const handleWeekdayToggle = (day) => {
    setEventData((prev) => {
      const newRepeatOn = [...prev.repeatOn]
      if (newRepeatOn.includes(day)) {
        return { ...prev, repeatOn: newRepeatOn.filter((d) => d !== day) }
      } else {
        return { ...prev, repeatOn: [...newRepeatOn, day].sort() }
      }
    })
  }

  const validateForm = () => {
    const newErrors = {}

    if (!eventData.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!eventData.startTime) {
      newErrors.startTime = "Start time is required"
    }

    if (!eventData.endTime) {
      newErrors.endTime = "End time is required"
    }

    // Check if end time is after start time
    const [startHours, startMinutes] = eventData.startTime.split(":").map(Number)
    const [endHours, endMinutes] = eventData.endTime.split(":").map(Number)
    const startTotalMinutes = startHours * 60 + startMinutes
    const endTotalMinutes = endHours * 60 + endMinutes

    if (endTotalMinutes <= startTotalMinutes) {
      newErrors.endTime = "End time must be after start time"
    }

    // Validate repeat options
    if (eventData.repeatOption !== "none") {
      if (!eventData.repeatUntil) {
        newErrors.repeatUntil = "End date is required for repeating events"
      }

      if (eventData.repeatOption === "weekly" && eventData.repeatOn.length === 0) {
        newErrors.repeatOn = "Select at least one day of the week"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(eventData)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">{editingEvent ? "Edit Event" : "Create Event"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <input
              type="text"
              name="title"
              value={eventData.title}
              onChange={handleInputChange}
              placeholder="Add title"
              className={`w-full px-4 py-3 text-lg font-medium border ${errors.title ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Time and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Clock className="h-4 w-4 mr-2" />
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                value={eventData.startTime}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${errors.startTime ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.startTime && <p className="mt-1 text-sm text-red-500">{errors.startTime}</p>}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Clock className="h-4 w-4 mr-2" />
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                value={eventData.endTime}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${errors.endTime ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.endTime && <p className="mt-1 text-sm text-red-500">{errors.endTime}</p>}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 mr-2" />
                Day
              </label>
              <select
                name="day"
                value={eventData.day}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Sunday</option>
                <option value={2}>Monday</option>
                <option value={3}>Tuesday</option>
                <option value={4}>Wednesday</option>
                <option value={5}>Thursday</option>
                <option value={6}>Friday</option>
                <option value={7}>Saturday</option>
              </select>
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">Color</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-6 h-6 rounded-full ${color.value} ${eventData.color === color.value ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
                    onClick={() => handleColorChange(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <MapPin className="h-4 w-4 mr-2" />
              Location
            </label>
            <input
              type="text"
              name="location"
              value={eventData.location}
              onChange={handleInputChange}
              placeholder="Add location"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <Info className="h-4 w-4 mr-2" />
              Description
            </label>
            <textarea
              name="description"
              value={eventData.description}
              onChange={handleInputChange}
              placeholder="Add description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Attendees */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <Users className="h-4 w-4 mr-2" />
              Attendees
            </label>
            <div className="flex">
              <input
                type="text"
                value={attendeeInput}
                onChange={(e) => setAttendeeInput(e.target.value)}
                placeholder="Add attendees"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === "Enter" && handleAddAttendee()}
              />
              <button
                type="button"
                onClick={handleAddAttendee}
                className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>

            {eventData.attendees.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {eventData.attendees.map((attendee, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                  >
                    {attendee}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttendee(index)}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Repeat Options */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <Repeat className="h-4 w-4 mr-2" />
              Repeat
            </label>
            <select
              name="repeatOption"
              value={eventData.repeatOption}
              onChange={handleRepeatChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {repeatOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            {showRepeatOptions && (
              <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                {eventData.repeatOption === "weekly" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Repeat on</label>
                    <div className="flex flex-wrap gap-2">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            eventData.repeatOn.includes(index)
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                          onClick={() => handleWeekdayToggle(index)}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                    {errors.repeatOn && <p className="mt-1 text-sm text-red-500">{errors.repeatOn}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Repeat until</label>
                  <input
                    type="date"
                    name="repeatUntil"
                    value={eventData.repeatUntil}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors.repeatUntil ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {errors.repeatUntil && <p className="mt-1 text-sm text-red-500">{errors.repeatUntil}</p>}
                </div>

                {(eventData.repeatOption === "daily" ||
                  eventData.repeatOption === "weekly" ||
                  eventData.repeatOption === "monthly" ||
                  eventData.repeatOption === "yearly") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Repeat every</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="repeatFrequency"
                        value={eventData.repeatFrequency}
                        onChange={handleInputChange}
                        min="1"
                        max="99"
                        className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700">
                        {eventData.repeatOption === "daily" && "day(s)"}
                        {eventData.repeatOption === "weekly" && "week(s)"}
                        {eventData.repeatOption === "monthly" && "month(s)"}
                        {eventData.repeatOption === "yearly" && "year(s)"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 mr-2 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {editingEvent ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}
