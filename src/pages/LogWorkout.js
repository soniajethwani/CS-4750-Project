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
  const [media, setMedia] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const groupId = params.get('groupId');


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
    for (const ex of selectedExercises) {
      const weight = Number(ex.weight);
      const reps = Number(ex.reps);
      const sets = Number(ex.sets);

      console.log(weight);
      console.log(reps);
      console.log(sets);
  
      if (isNaN(weight) || isNaN(reps) || isNaN(sets) || weight < 0 || reps <= 0 || sets <= 0) {
        alert("Please ensure all exercises have positive numbers for weight, reps, and sets.");
        return;
      }
      if(weight === 0){
        ex.weight = "body weight"
        console.log(true);
      }

      console.log(ex.weight);
      console.log(ex.reps);
      console.log(ex.sets);
    }

    try {
      const formData = new FormData();
      formData.append('caption', caption);
      formData.append('exercises', JSON.stringify(selectedExercises));
      if (media) formData.append('media', media);
      if (groupId) formData.append('group_id', groupId);

      await axios.post('http://localhost:4000/posts', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  return (
    <Box p={4}>
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
            <MenuItem value="abdominals">Abdominals</MenuItem>
            <MenuItem value="abductors">Abductors</MenuItem>
            <MenuItem value="adductors">Adductors</MenuItem>
            <MenuItem value="biceps">Biceps</MenuItem>
            <MenuItem value="calves">Calves</MenuItem>
            <MenuItem value="chest">Chest</MenuItem>
            <MenuItem value="forearms">Forearms</MenuItem>
            <MenuItem value="glutes">Glutes</MenuItem>
            <MenuItem value="hamstrings">Hamstrings</MenuItem>
            <MenuItem value="lats">Lats</MenuItem>
            <MenuItem value="lower_back">Lower Back</MenuItem>
            <MenuItem value="middle_back">Middle Back</MenuItem>
            <MenuItem value="neck">Neck</MenuItem>
            <MenuItem value="quadriceps">Quadriceps</MenuItem>
            <MenuItem value="traps">Traps</MenuItem>
            <MenuItem value="triceps">Triceps</MenuItem>
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

      {/* Caption and Media */}
      <Box mb={4}>
        <TextField
          label="Workout Notes"
          multiline
          rows={4}
          fullWidth
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setMedia(e.target.files[0])}
          style={{ marginTop: '16px' }}
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