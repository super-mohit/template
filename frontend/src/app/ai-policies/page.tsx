// File: frontend/src/app/ai-policies/page.tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  getAiPolicies,
  createAiPolicy,
  updateAiPolicy,
  type AiPolicy,
  type AiPolicyCreate,
} from '@/lib/api-client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { RuleBuilder } from '@/components/policies/RuleBuilder'
import { Loader2, PlusCircle, Edit } from 'lucide-react'

export default function AiPoliciesPage() {
  const [policies, setPolicies] = useState<AiPolicy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AiPolicy | null>(null)

  const fetchPolicies = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getAiPolicies()
      setPolicies(data)
    } catch (error) {
      console.error('Failed to load AI policies:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPolicies()
  }, [fetchPolicies])

  const handleOpenModal = (rule: AiPolicy | null) => {
    setEditingRule(rule)
    setIsModalOpen(true)
  }

  const handleSave = async (data: AiPolicyCreate) => {
    try {
      if (editingRule) {
        await updateAiPolicy(editingRule.id, data)
        console.log('Rule updated successfully!')
      } else {
        await createAiPolicy(data)
        console.log('New rule created successfully!')
      }
      setIsModalOpen(false)
      fetchPolicies() // Refresh the list
    } catch (error) {
      console.error(`Failed to save rule:`, error)
      // Re-throw to keep the modal's saving state correct
      throw error
    }
  }

  return (
    <>
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>AI Policy Engine</CardTitle>
                <CardDescription>
                  Manage the natural language rules that govern the AI&apos;s
                  decision-making process.
                </CardDescription>
              </div>
              <Button onClick={() => handleOpenModal(null)}>
                <PlusCircle className='mr-2 h-4 w-4' />
                Add New Rule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='flex justify-center py-8'>
                <Loader2 className='h-8 w-8 animate-spin' />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className='font-medium'>
                        {policy.name}
                      </TableCell>
                      <TableCell>{policy.policy_type}</TableCell>
                      <TableCell className='max-w-md truncate'>
                        {policy.natural_language_rule}
                      </TableCell>
                      <TableCell>
                        {policy.is_active ? 'Active' : 'Inactive'}
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleOpenModal(policy)}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRule ? 'Edit AI Rule' : 'Create AI Rule'}
      >
        <RuleBuilder
          initialData={editingRule || undefined}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  )
}
