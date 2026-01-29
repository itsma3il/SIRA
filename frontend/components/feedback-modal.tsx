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
      <DialogContent className="sm:max-w-131.25" aria-describedby="feedback-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" aria-hidden="true" />
            Rate This Recommendation
          </DialogTitle>
          <DialogDescription id="feedback-description">
            Your feedback helps us improve future recommendations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Overall Rating *</Label>
            <div 
              className="flex items-center justify-center gap-2 sm:gap-3" 
              role="radiogroup" 
              aria-label="Rate from 1 to 5 stars"
              aria-required="true"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`${star} star${star > 1 ? 's' : ''}: ${getRatingLabel(star)}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' && star < 5) {
                      e.preventDefault();
                      const nextButton = e.currentTarget.nextElementSibling as HTMLButtonElement;
                      nextButton?.click();
                      nextButton?.focus();
                    } else if (e.key === 'ArrowLeft' && star > 1) {
                      e.preventDefault();
                      const prevButton = e.currentTarget.previousElementSibling as HTMLButtonElement;
                      prevButton?.click();
                      prevButton?.focus();
                    } else if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setRating(star);
                    }
                  }}
                  className="transition-transform hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm p-1 sm:p-2 touch-manipulation"
                >
                  <Star
                    className={`h-8 w-8 sm:h-10 sm:w-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <div className="text-center">
                <Badge variant="secondary" className="text-sm">
                  {getRatingLabel(rating)}
                </Badge>
              </div>
            )}
          </div>

          {/* Comment Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <Label htmlFor="comment" className="text-sm font-medium">Additional Comments (Optional)</Label>
              <span className="text-xs text-muted-foreground">
                {comment.length}/1000
              </span>
            </div>
            
            {/* Prompt Questions */}
            <div className="text-xs sm:text-sm text-muted-foreground space-y-1 pl-3 sm:pl-4 border-l-2 border-muted">
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
              className="resize-none text-sm"
              aria-describedby="comment-helper"
            />
          </div>

          {/* Helper Text */}
          <div id="comment-helper" className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            <strong>Your feedback matters!</strong> We use it to:
            <ul className="mt-1 ml-4 space-y-0.5">
              <li>• Improve our recommendation algorithm</li>
              <li>• Understand what information is most valuable</li>
              <li>• Train our AI to provide better matches</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="w-full sm:w-auto"
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="w-full sm:w-auto"
            type="submit"
            aria-label={rating === 0 ? "Please select a rating first" : "Submit feedback"}
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
