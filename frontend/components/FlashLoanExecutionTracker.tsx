"use client";

import React, { useState, useEffect, useRef } from 'react';

// Define types for execution steps
export type StepStatus = 'pending' | 'success' | 'error' | 'warning' | 'info';

export interface ExecutionStep {
  id: string;
  message: string;
  status: StepStatus;
  timestamp: number;
  details?: string;
  txHash?: string;
}

// Define event types
export type ExecutionEventType = 
  | 'flashloan:initiated'
  | 'flashloan:borrowing'
  | 'flashloan:swapping'
  | 'flashloan:executing'
  | 'flashloan:repaying'
  | 'flashloan:profiting'
  | 'flashloan:completed'
  | 'flashloan:error'
  | 'flashloan:revert'
  | 'flashloan:reset';

interface FlashLoanExecutionTrackerProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

// Create a global event system for tracking flash loan execution
// This will allow any component to emit execution events
class FlashLoanExecutionEvents {
  private static listeners: { [key: string]: Function[] } = {};
  private static modalRef: React.RefObject<HTMLDialogElement> | null = null;

  static setModalRef(ref: React.RefObject<HTMLDialogElement>) {
    this.modalRef = ref;
  }

  static showModal() {
    if (this.modalRef?.current) {
      this.modalRef.current.showModal();
    }
  }

  static closeModal() {
    if (this.modalRef?.current) {
      this.modalRef.current.close();
    }
  }

  static subscribe(event: ExecutionEventType, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(
        (listener) => listener !== callback
      );
    };
  }

  static emit(event: ExecutionEventType, data: any) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((callback) => callback(data));
    
    // Auto-show modal on any execution event except reset
    if (event !== 'flashloan:reset') {
      this.showModal();
    }
  }

  static reset() {
    this.emit('flashloan:reset', {});
  }

  static addStep(message: string, status: StepStatus, details?: string, txHash?: string) {
    const step: ExecutionStep = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      status,
      timestamp: Date.now(),
      details,
      txHash,
    };
    this.emit('flashloan:executing', step);
    return step.id;
  }

  static updateStep(id: string, status: StepStatus, message?: string, details?: string) {
    this.emit('flashloan:executing', {
      id,
      status,
      message,
      details,
      timestamp: Date.now(),
    });
  }
}

// Export for other components to use
export const FlashLoanEvents = FlashLoanExecutionEvents;

export default function FlashLoanExecutionTracker({ 
  className = '', 
  isOpen = false, 
  onClose 
}: FlashLoanExecutionTrackerProps) {
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [activeExecution, setActiveExecution] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Set modal ref for global access
  useEffect(() => {
    FlashLoanEvents.setModalRef(dialogRef);
    
    // Initialize modal state
    if (isOpen && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }

    return () => {
      // Clean up reference when component unmounts
      FlashLoanEvents.setModalRef(null);
    };
  }, [isOpen]);

  // Handle prop changes to control modal
  useEffect(() => {
    if (isOpen && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    } else if (!isOpen && dialogRef.current && dialogRef.current.open) {
      dialogRef.current.close();
    }
  }, [isOpen]);

  // Handle dialog close event
  const handleDialogClose = () => {
    // Close the dialog directly using the ref
    if (dialogRef.current) {
      dialogRef.current.close();
    }
    // Also call the onClose prop if provided
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    // Subscribe to flash loan execution events
    const executingUnsubscribe = FlashLoanEvents.subscribe(
      'flashloan:executing',
      (step: ExecutionStep) => {
        setSteps((prev) => {
          // If the step already exists, update it
          if (step.id && prev.some((s) => s.id === step.id)) {
            return prev.map((s) =>
              s.id === step.id ? { ...s, ...step } : s
            );
          }
          // Otherwise, add it to the list
          return [...prev, step];
        });
        setActiveExecution(true);
      }
    );

    // Subscribe to reset events
    const resetUnsubscribe = FlashLoanEvents.subscribe(
      'flashloan:reset',
      () => {
        setSteps([]);
        setActiveExecution(false);
      }
    );

    return () => {
      executingUnsubscribe();
      resetUnsubscribe();
    };
  }, []);
  
  // Prevent clicks on the dialog from closing it when clicking backdrop
  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const getStatusStyles = (status: StepStatus) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 border-green-500/40 text-green-400';
      case 'error':
        return 'bg-red-500/20 border-red-500/40 text-red-400';
      case 'warning':
        return 'bg-amber-500/20 border-amber-500/40 text-amber-400';
      case 'info':
        return 'bg-blue-500/20 border-blue-500/40 text-blue-400';
      case 'pending':
      default:
        return 'bg-slate-700/50 border-slate-600/40 text-slate-300';
    }
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'success':
        return (
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        );
      case 'error':
        return (
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        );
      case 'info':
        return (
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      case 'pending':
      default:
        return (
          <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
    }
  };

  const LoadingContent = () => (
    <div className="flex items-center justify-center text-cyan-400 text-sm p-6">
      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Initializing Flash Loan Execution...
    </div>
  );

  // Main dialog content
  const ModalContent = () => (
    <>
      {/* Header */}
      <div className="flex justify-between items-center p-3 bg-slate-700/30 border-b border-slate-700/50">
        <div className="flex items-center">
          <div className="w-5 h-5 mr-2 bg-blue-500/90 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 10C10.1046 10 11 9.10457 11 8C11 6.89543 10.1046 6 9 6C7.89543 6 7 6.89543 7 8C7 9.10457 7.89543 10 9 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2.67 18.95L7.6 15.64C8.39 15.11 9.53 15.17 10.24 15.78L10.57 16.07C11.35 16.74 12.61 16.74 13.39 16.07L17.55 12.5C18.33 11.83 19.59 11.83 20.37 12.5L22 13.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-white text-sm font-medium">Flash Loan Execution</h3>
        </div>
        <button 
          onClick={handleDialogClose} 
          className="text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      {/* Timeline */}
      <div className="p-3 max-h-80 overflow-y-auto">
        {steps.length === 0 ? (
          <div className="flex items-center justify-center text-cyan-400 text-sm p-4">
            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Initializing...
          </div>
        ) : (
          <div className="relative">
            {/* Timeline connector */}
            <div className="absolute top-0 bottom-0 left-3.5 w-0.5 bg-slate-700/70"></div>
            
            {/* Steps */}
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div key={step.id || index} className="relative pl-7">
                  {/* Status dot */}
                  <div className={`absolute left-0 top-0 mt-1.5 w-7 h-7 rounded-full border flex items-center justify-center ${getStatusStyles(step.status)}`}>
                    {getStatusIcon(step.status)}
                  </div>
                  
                  {/* Step content */}
                  <div className={`p-2 rounded-lg ${getStatusStyles(step.status)}`}>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-medium">{step.message}</span>
                      <span className="text-[10px] opacity-70 ml-2">
                        {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    
                    {/* Additional details */}
                    {step.details && (
                      <div className="mt-1 text-[10px] opacity-80 break-words">
                        {step.details}
                      </div>
                    )}
                    
                    {/* Transaction hash */}
                    {step.txHash && (
                      <div className="mt-1 text-[10px] font-mono bg-slate-800/70 p-1 rounded overflow-x-auto">
                        TX: {step.txHash}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-3 border-t border-slate-700/50 bg-slate-700/20 flex justify-between">
        <button 
          onClick={handleDialogClose}
          className="text-xs px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700/80 text-white rounded transition-colors"
        >
          Close
        </button>
        <button 
          onClick={() => FlashLoanEvents.reset()}
          className="text-xs px-3 py-1.5 bg-red-900/20 hover:bg-red-900/30 text-red-300 rounded transition-colors"
        >
          Clear
        </button>
      </div>
    </>
  );

  return (
    <dialog 
      ref={dialogRef}
      className={`rounded-lg bg-slate-800/90 backdrop-blur-lg overflow-hidden shadow-xl p-0 max-w-lg w-full backdrop:bg-black/80 ${className}`}
      onClick={handleDialogClick}
      onClose={handleDialogClose}
    >
      <ModalContent />
    </dialog>
  );
}

// Helper function to open the flash loan tracker modal from anywhere
export function openFlashLoanTracker() {
  FlashLoanEvents.showModal();
}

// Helper function to close the flash loan tracker modal from anywhere
export function closeFlashLoanTracker() {
  FlashLoanEvents.closeModal();
} 