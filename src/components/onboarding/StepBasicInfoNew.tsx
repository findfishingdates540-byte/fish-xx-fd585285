import { useState, useEffect } from "react";
import { AnimatedInput } from "@/components/ui/animated-input";
import { SelectableCard } from "@/components/ui/selectable-card";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { motion } from "framer-motion";

type Gender = 'male' | 'female' | 'non_binary' | 'other' | 'prefer_not_to_say';

interface StepBasicInfoNewProps {
  firstName: string;
  setFirstName: (value: string) => void;
  dateOfBirth: string;
  setDateOfBirth: (value: string) => void;
  gender: Gender | null;
  setGender: (value: Gender) => void;
  showGender?: boolean;
}

const genderOptions: { value: Gender; label: string; icon: string }[] = [
  { value: 'male', label: 'Male', icon: '♂' },
  { value: 'female', label: 'Female', icon: '♀' },
  { value: 'other', label: 'Other', icon: '⚥' },
];

export function StepBasicInfoNew({
  firstName,
  setFirstName,
  dateOfBirth,
  setDateOfBirth,
  gender,
  setGender,
  showGender = true,
}: StepBasicInfoNewProps) {
  const [firstNameError, setFirstNameError] = useState('');
  const [dobError, setDobError] = useState('');
  const [firstNameTouched, setFirstNameTouched] = useState(false);
  const [dobTouched, setDobTouched] = useState(false);

  const today = new Date();
  const minAge = 18;
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate())
    .toISOString()
    .split('T')[0];

  // Validate first name
  useEffect(() => {
    if (!firstNameTouched) return;
    if (!firstName.trim()) {
      setFirstNameError('Please enter your first name');
    } else if (firstName.length < 2) {
      setFirstNameError('Name must be at least 2 characters');
    } else if (firstName.length > 50) {
      setFirstNameError('Name must be less than 50 characters');
    } else {
      setFirstNameError('');
    }
  }, [firstName, firstNameTouched]);

  // Validate date of birth
  useEffect(() => {
    if (!dobTouched) return;
    if (!dateOfBirth) {
      setDobError('Please enter your date of birth');
    } else {
      const dob = new Date(dateOfBirth);
      const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) {
        setDobError('You must be at least 18 years old');
      } else if (age > 120) {
        setDobError('Please enter a valid date');
      } else {
        setDobError('');
      }
    }
  }, [dateOfBirth, dobTouched]);

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      {/* First Name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <AnimatedInput
          label="First Name"
          type="text"
          placeholder="e.g. River"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          onBlur={() => setFirstNameTouched(true)}
          error={firstNameError}
          success={firstNameTouched && !firstNameError && firstName.length >= 2}
          icon={<User className="w-5 h-5" />}
        />
      </motion.div>

      {/* Date of Birth */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatedInput
          label="Date of Birth"
          type="date"
          max={maxDate}
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          onBlur={() => setDobTouched(true)}
          error={dobError}
          success={dobTouched && !dobError && !!dateOfBirth}
        />
        {!dobError && (
          <motion.p 
            className="text-xs text-primary mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            You must be at least 18 years old to use FindFish Date.
          </motion.p>
        )}
      </motion.div>

      {/* Gender Selection */}
      {showGender && (
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Label className="text-sm font-medium text-foreground">
            I identify as...
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {genderOptions.map((option, index) => (
              <motion.div
                key={option.value}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <SelectableCard
                  selected={gender === option.value}
                  onClick={() => setGender(option.value)}
                  className="flex flex-col items-center justify-center py-4"
                >
                  <span className="text-2xl text-primary mb-1">{option.icon}</span>
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                </SelectableCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
