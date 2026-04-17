'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Course } from '@/types/database'

interface CourseFormData {
  name: string
  location: string
  green_fee: string
  rounds: string
  notes: string
}

const empty: CourseFormData = { name: '', location: '', green_fee: '', rounds: '', notes: '' }

function CourseForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: CourseFormData
  onSave: (data: CourseFormData) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<CourseFormData>(initial ?? empty)
  const [loading, setLoading] = useState(false)

  function set(field: keyof CourseFormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await onSave(form)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-gray-100">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Course name *</label>
          <input
            required
            value={form.name}
            onChange={set('name')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Pebble Beach Golf Links"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
          <input
            value={form.location}
            onChange={set('location')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Pebble Beach, CA"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Green fee ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.green_fee}
            onChange={set('green_fee')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="595"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Rounds</label>
          <input
            type="number"
            min="1"
            value={form.rounds}
            onChange={set('rounds')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="1"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            placeholder="Optional notes…"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white text-sm px-4 py-1.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm px-4 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function CourseSection({ tripId, initialCourses }: { tripId: string; initialCourses: Course[] }) {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  function toFormData(c: Course): CourseFormData {
    return {
      name: c.name,
      location: c.location ?? '',
      green_fee: c.green_fee?.toString() ?? '',
      rounds: c.rounds?.toString() ?? '',
      notes: c.notes ?? '',
    }
  }

  async function handleAdd(data: CourseFormData) {
    const supabase = createClient()
    const { data: created } = await supabase
      .from('courses')
      .insert({
        trip_id: tripId,
        name: data.name,
        location: data.location || null,
        green_fee: data.green_fee ? parseFloat(data.green_fee) : null,
        rounds: data.rounds ? parseInt(data.rounds) : null,
        notes: data.notes || null,
      })
      .select()
      .single()

    if (created) {
      setCourses(c => [...c, created])
      setAdding(false)
      router.refresh()
    }
  }

  async function handleEdit(id: string, data: CourseFormData) {
    const supabase = createClient()
    const { data: updated } = await supabase
      .from('courses')
      .update({
        name: data.name,
        location: data.location || null,
        green_fee: data.green_fee ? parseFloat(data.green_fee) : null,
        rounds: data.rounds ? parseInt(data.rounds) : null,
        notes: data.notes || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (updated) {
      setCourses(c => c.map(x => x.id === id ? updated : x))
      setEditingId(null)
      router.refresh()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this course?')) return
    const supabase = createClient()
    await supabase.from('courses').delete().eq('id', id)
    setCourses(c => c.filter(x => x.id !== id))
    router.refresh()
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Courses</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-sm text-green-600 font-medium hover:text-green-700"
          >
            + Add course
          </button>
        )}
      </div>

      {courses.length === 0 && !adding && (
        <p className="text-sm text-gray-400">No courses added yet.</p>
      )}

      <ul className="space-y-3">
        {courses.map(course => (
          <li key={course.id} className="border border-gray-100 rounded-lg p-3">
            {editingId === course.id ? (
              <CourseForm
                initial={toFormData(course)}
                onSave={data => handleEdit(course.id, data)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{course.name}</p>
                    {course.location && <p className="text-xs text-gray-500 mt-0.5">{course.location}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setEditingId(course.id)}
                      className="text-xs text-gray-500 hover:text-gray-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 mt-2 text-xs text-gray-500">
                  {course.green_fee && <span>${course.green_fee.toLocaleString()} green fee</span>}
                  {course.rounds && <span>{course.rounds} round{course.rounds !== 1 ? 's' : ''}</span>}
                </div>
                {course.notes && <p className="text-xs text-gray-400 mt-1 italic">{course.notes}</p>}
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding && (
        <CourseForm
          onSave={handleAdd}
          onCancel={() => setAdding(false)}
        />
      )}
    </section>
  )
}
