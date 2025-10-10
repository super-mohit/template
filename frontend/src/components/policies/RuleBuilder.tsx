// File: frontend/src/components/policies/RuleBuilder.tsx
'use client'
import { useState, useEffect, FormEvent } from 'react'
import { type AiPolicyCreate } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

interface RuleBuilderProps {
  initialData?: AiPolicyCreate
  onSave: (data: AiPolicyCreate) => Promise<void>
  onCancel: () => void
}

const defaultData: AiPolicyCreate = {
  name: '',
  policy_type: 'BASE',
  context_field: null,
  natural_language_rule: '',
  is_active: true,
}

export function RuleBuilder({
  initialData,
  onSave,
  onCancel,
}: RuleBuilderProps) {
  const [formData, setFormData] = useState<AiPolicyCreate>(defaultData)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setFormData(initialData || defaultData)
  }, [initialData])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave(formData)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <label className='text-sm font-medium'>Rule Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <label className='text-sm font-medium'>Rule</label>
        <Textarea
          value={formData.natural_language_rule}
          onChange={(e) =>
            setFormData({ ...formData, natural_language_rule: e.target.value })
          }
          required
          rows={3}
          placeholder='e.g., If amount is greater than 10000, status must be REVIEW'
        />
      </div>
      <div className='flex items-center space-x-2'>
        <Checkbox
          id='is_active'
          checked={formData.is_active}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, is_active: !!checked })
          }
        />
        <label htmlFor='is_active' className='text-sm font-medium'>
          Rule is Active
        </label>
      </div>
      <div className='flex justify-end gap-2 border-t pt-4'>
        <Button
          type='button'
          variant='secondary'
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button type='submit' disabled={isSaving}>
          {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Save Rule
        </Button>
      </div>
    </form>
  )
}
