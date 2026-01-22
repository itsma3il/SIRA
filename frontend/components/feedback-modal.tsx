"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";
import type { RecommendationFeedback } from "@/lib/types/recommendation";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (feedback: RecommendationFeedback) => Promise<void>;
  initialRating?: number;
  initialComment?: string;
}

export function FeedbackModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  initialRating, 
  initialComment 
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(initialRating || 0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(initialComment || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      return; // Require at least a rating
    }

    try {
      setSubmitting(true);
      await onSubmit({
        feedback_rating: rating,
        feedback_comment: comment || undefined
      });
      onOpenChange(false);
      // Reset form
      setRating(initialRating || 0);
      setComment(initialComment || "");
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 1: return "Poor";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Very Good";
      case 5: return "Excellent";
      default: return "";
    }
  };

  const promptQuestions = [
    "Were the recommendations relevant to your profile?",
    "Were the programs at the right difficulty level?",
    "Was the information detailed enough?",
    "What could be improved?"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-131.25">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Rate This Recommendation
          </DialogTitle>
          <DialogDescription>
            Your feedback helps us improve future recommendations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-3">
            <Label>Overall Rating *</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <Badge variant="secondary" className="text-sm">
                {getRatingLabel(rating)}
              </Badge>
            )}
          </div>

          {/* Comment Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="comment">Additional Comments (Optional)</Label>
              <span className="text-xs text-muted-foreground">
                {comment.length}/1000
              </span>
            </div>
            
            {/* Prompt Questions */}
            <div className="text-sm text-muted-foreground space-y-1 pl-4 border-l-2 border-muted">
              <p className="font-medium">Consider:</p>
              {promptQuestions.map((question, idx) => (
                <p key={idx}>• {question}</p>
              ))}
            </div>

            <Textarea
              id="comment"
              placeholder="Share your thoughts about this recommendation..."
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 1000))}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Helper Text */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            <strong>Your feedback matters!</strong> We use it to:
            <ul className="mt-1 ml-4 space-y-0.5">
              <li>• Improve our recommendation algorithm</li>
              <li>• Understand what information is most valuable</li>
              <li>• Train our AI to provide better matches</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
