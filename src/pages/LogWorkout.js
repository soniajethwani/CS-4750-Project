// src/pages/LogWorkout.js
import React, { useState, useEffect } from 'react';
import { Button, TextField, Select, MenuItem, Box, Typography, Chip } from '@mui/material';
import { fetchExercises } from '../services/exerciseApi';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

function LogWorkout() {
  const [exercises, setExercises] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [searchParams, setSearchParams] = useState({ muscle: '' });
  const [caption, setCaption] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const groupId = params.get('groupId');
  const [openCustomDialog, setOpenCustomDialog] = useState(false);
  const [customExercise, setCustomExercise] = useState({ name: '', muscle: '' });

  // Fetch exercises when search params change
  useEffect(() => {
    const loadExercises = async () => {
      const data = await fetchExercises(searchParams);
      setExercises(data);
    };
    loadExercises();
  }, [searchParams]);

  const handleAddExercise = (exercise) => {
    setSelectedExercises(prev => [...prev, {
      ...exercise,
      weight: '',
      reps: '',
      sets: ''
    }]);
  };

  const handleRemoveExercise = (index) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index, field, value) => {
    setSelectedExercises(prev => prev.map((ex, i) => 
      i === index ? { ...ex, [field]: value } : ex
    ));
  };

  const handleSubmit = async () => {
    try {
      // build payload without media
      const payload = {
        caption,
        exercises: JSON.stringify(selectedExercises),
        ...(groupId && { group_id: groupId })
      };

      await axios.post('http://localhost:4000/posts', payload, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  return (
    <Box p={4} pb={10}>
      <Box mb={4} display="flex" justifyContent="space-between">
        <Typography variant="h4" gutterBottom>Log Workout</Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/profile')}
        >
          Back to Profile
        </Button>
      </Box>
      
      {/* Exercise Search */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>Find Exercises</Typography>
        <Select
          value={searchParams.muscle}
          onChange={(e) => setSearchParams({ muscle: e.target.value })}
          displayEmpty
          fullWidth
        >
          <MenuItem value="">All Muscle Groups</MenuItem>
          {/* …the rest of your MenuItem list… */}
        </Select>
        
        {/* Exercise Results */}
        <Box mt={2}>
          {exercises.map((exercise, i) => (
            <Chip
              key={i}
              label={exercise.name}
              onClick={() => handleAddExercise(exercise)}
              style={{ margin: '4px' }}
            />
          ))}
        </Box>

        <Button 
          variant="outlined" 
          onClick={() => setOpenCustomDialog(true)} 
          style={{ marginTop: '16px' }}
        >
          Add New Exercise
        </Button>

        {/* Custom Exercise Input */}
        {openCustomDialog && (
          <Box mt={2} p={2} border={1} borderRadius={2}>
            <Typography variant="h6" gutterBottom>Add Custom Exercise</Typography>
            <TextField
              label="Exercise Name"
              fullWidth
              value={customExercise.name}
              onChange={(e) => setCustomExercise(prev => ({ ...prev, name: e.target.value }))}
              style={{ marginBottom: '16px' }}
            />
            <Select
              value={customExercise.muscle}
              onChange={(e) => setCustomExercise(prev => ({ ...prev, muscle: e.target.value }))}
              displayEmpty
              fullWidth
            >
              <MenuItem value="">Select Muscle Group</MenuItem>
              {/* …map your muscle groups here… */}
            </Select>
            <Box mt={2}>
              <Button 
                variant="contained" 
                onClick={() => {
                  if (customExercise.name && customExercise.muscle) {
                    handleAddExercise(customExercise);
                    setOpenCustomDialog(false);
                    setCustomExercise({ name: '', muscle: '' });
                  }
                }}
                style={{ marginRight: '8px' }}
              >
                Add
              </Button>
              <Button variant="outlined" onClick={() => setOpenCustomDialog(false)}>
                Cancel
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Selected Exercises */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>Your Workout</Typography>
        {selectedExercises.map((exercise, i) => (
          <Box key={i} p={2} mb={2} border={1} borderRadius={2}>
            <Typography>{exercise.name}</Typography>
            <TextField
              label="Weight (lbs)"
              type="number"
              value={exercise.weight}
              onChange={(e) => handleExerciseChange(i, 'weight', e.target.value)}
              style={{ marginRight: '8px', width: '100px' }}
            />
            <TextField
              label="Reps"
              type="number"
              value={exercise.reps}
              onChange={(e) => handleExerciseChange(i, 'reps', e.target.value)}
              style={{ marginRight: '8px', width: '80px' }}
            />
            <TextField
              label="Sets"
              type="number"
              value={exercise.sets}
              onChange={(e) => handleExerciseChange(i, 'sets', e.target.value)}
              style={{ width: '80px' }}
            />
            <Button onClick={() => handleRemoveExercise(i)}>Remove</Button>
          </Box>
        ))}
      </Box>

      {/* Caption only */}
      <Box mb={4}>
        <TextField
          label="Workout Notes"
          multiline
          rows={4}
          fullWidth
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      </Box>

      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleSubmit}
        disabled={selectedExercises.length === 0}
      >
        Finish Workout
      </Button>
    </Box>
  );
}

export default LogWorkout;
