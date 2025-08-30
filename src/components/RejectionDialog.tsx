'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { XCircle, Loader2 } from 'lucide-react'

interface RejectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  loading: boolean
}

export default function RejectionDialog({ isOpen, onClose, onConfirm, loading }: RejectionDialogProps) {
  const [rejectionReason, setRejectionReason] = useState('')

  const handleConfirm = () => {
    if (rejectionReason.trim()) {
      onConfirm(rejectionReason.trim())
      setRejectionReason('')
    }
  }

  const handleClose = () => {
    setRejectionReason('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-700">
            <XCircle className="mr-2 h-5 w-5" />
            Reject Entry
          </DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this production entry. The team leader will see this feedback.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="rejectionReason">Rejection Reason *</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e:any) => setRejectionReason(e.target.value)}
              placeholder="Enter detailed reason for rejection..."
              className="mt-1 min-h-[100px]"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirm}
              disabled={!rejectionReason.trim() || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject Entry'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}