import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import CssBaseline from '@mui/material/CssBaseline'
import TextField from '@mui/material/TextField'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import Checkbox from '@mui/material/Checkbox'
import Link from '@mui/material/Link'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import { logger } from '../../utils/logger'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'

// Import task data
import tutorial from '../Space2Think/dataset/tutorial.js'
// import task1Shape from '../Space2Think/dataset/task1.js'
// import task2Shape from '../Space2Think/dataset/task2.js'
import crescentCluster from '../Space2Think/dataset/crescent.js'
import yellowstoneCluster from '../Space2Think/dataset/yellowstone.js'

function Copyright (props) {
  return (
    <Typography
      variant='body2'
      color='text.secondary'
      align='center'
      {...props}
    >
      {'Copyright © '}
      <Link color='inherit' href='https://mui.com/'>
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  )
}

const theme = createTheme()

export default function SignIn () {
  const [cond, setCondition] = React.useState('advanced')
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [status, setStatus] = React.useState('') // [idle, pending, resolved, rejected]
  const [message, setMessage] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedTask, setSelectedTask] = React.useState('tutorial')

  const navigate = useNavigate()

  const tasks = [
    { id: 'tutorial', name: 'Tutorial Task', data: tutorial },
    // { id: 'task1', name: 'Task 1', data: task1Shape },
    { id: 'task1', name: 'Task 1', data: crescentCluster },
    { id: 'task2', name: 'Task 2', data: yellowstoneCluster }
  ]

  async function authenticate () {
    if (!username.trim()) {
      setStatus('fail')
      setMessage('Username is required')
      return
    }

    setIsLoading(true)
    setStatus('pending')

    try {
      // Log login attempt with task info
      await logger.logUserAction('login_attempt', { 
        username, 
        condition: cond, 
        selectedTask,
        taskName: tasks.find(t => t.id === selectedTask)?.name 
      })

      const res = await fetch('http://localhost:3001/api/signup', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          username: username,
          password: password,
          condition: cond,
          task: selectedTask,
          taskData: tasks.find(t => t.id === selectedTask)?.data || []
        })
      })
        .then(res => res.json())
        .then(res => {
          console.log(res)
          setStatus(res.status)
          setMessage(res.message)
          let editorSlice = null
          let spaceSlice = null
          if (res.preload === true) {
            editorSlice = res.editorSlice
            spaceSlice = res.spaceSlice
          }

          const taskProblem = res.taskProblem
          const taskDescription = res.taskDescription

          const task = {
            topic: taskProblem,
            description: taskDescription
          }

          console.log('task: ', task)

          const sessionId = Math.floor(Math.random() * 10000)

          if (res.status === 'success') {
            // Set up logging context for the user
            logger.setUserContext(username, sessionId, selectedTask)
            
            // Log successful login with task info
            logger.logUserAction('login_success', { 
              username, 
              condition: cond,
              sessionId,
              hasPreload: res.preload,
              selectedTask,
              taskName: tasks.find(t => t.id === selectedTask)?.name
            })

            navigate('/space2think', {
              state: {
                condition: 'advanced',
                username: username,
                preload: res.preload,
                sessionId: sessionId,
                editorSlice: editorSlice,
                spaceSlice: spaceSlice,
                selectedTask: selectedTask,
                taskData: tasks.find(t => t.id === selectedTask)?.data || [],
                autoOpenTask: selectedTask // Add this to trigger automatic file opening
              }
            })
          } else {
            // Log failed login
            logger.logUserAction('login_failed', { 
              username, 
              reason: res.message,
              selectedTask,
              taskName: tasks.find(t => t.id === selectedTask)?.name
            })
          }
        })
    } catch (error) {
      console.error('Authentication error:', error)
      setStatus('fail')
      setMessage('Network error. Please try again.')
      
      // Log authentication error
      logger.error('AUTHENTICATION', 'login_error', { 
        username, 
        error: error.message,
        selectedTask,
        taskName: tasks.find(t => t.id === selectedTask)?.name
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Container component='main'>
        <CssBaseline />
        <Box
          sx={{
            marginTop: 15,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography component='h1' variant='h5'>
            Hello, ReSPIRE 📘
          </Typography>
          <Box
            sx={{
              mt: 2,
              width: "35%"
            }}
          >
            <TextField
              margin='normal'
              required
              fullWidth
              id='username'
              label='Please enter a nickname'
              value={username}
              onFocus={() => {
                setStatus('idle')
                setMessage('')
              }}
              onChange={e => {
                setUsername(e.target.value)
              }}
              autoFocus
              disabled={isLoading}
            />
            <FormControl fullWidth margin="normal">
              <FormLabel component="legend">Select Task</FormLabel>
              <Select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                disabled={isLoading}
              >
                {tasks.map((task) => (
                  <MenuItem key={task.id} value={task.id}>
                    {task.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              type='submit'
              fullWidth
              variant='contained'
              sx={{ mt: 3, mb: 2 }}
              onClick={authenticate}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Enter'}
            </Button>
            {status === 'fail' && message === 'Password incorrect' && (
              <Typography sx={{ color: 'red' }}>Password incorrect</Typography>
            )}
            {status === 'fail' && message === 'User not found' && (
              <Typography sx={{ color: 'red' }}>User not found</Typography>
            )}
            {status === 'fail' && message !== 'Password incorrect' && message !== 'User not found' && (
              <Typography sx={{ color: 'red' }}>{message}</Typography>
            )}
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  )
}
