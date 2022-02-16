import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { Col, Container, Row, Form, FormControl, ListGroup } from 'react-bootstrap'
import { io } from 'socket.io-client'
import IMessage from '../types/message'
import IUser from '../types/user'

const { REACT_APP_ADDRESS: ADDRESS } = process.env
const socket = io(ADDRESS!, { transports: ['websocket'] })

const Home = () => {
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<IUser[]>([])
  const [chatHistory, setChatHistory] = useState<IMessage[]>([])
  const [room, setRoom] = useState('')

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connection is now established!')
    })

    socket.on('loggedin', () => {
      console.log('username successfully registered! :)')
      setLoggedIn(true)
      fetchOnlineUsers()
      socket.on('newConnection', () => {
        console.log('a new user just connected!')
        fetchOnlineUsers()
      })
      socket.on('message', (message) => {
        console.log('new message received!')
        console.log(message)
        setChatHistory((currentChatHistory) => [...currentChatHistory, message])
      })
    })
  }, [])

  const submitUsername = (e: FormEvent) => {
    e.preventDefault()
    socket.emit('setUsername', { username: username, room: username })
  }

  const fetchOnlineUsers = async () => {
    try {
      let response = await fetch(ADDRESS + '/online-users')
      if (response.ok) {
        let data = await response.json()
        console.log(data)
        let onlineUsers: IUser[] = data.onlineUsers
        setOnlineUsers(onlineUsers)
      } else {
        console.log('error retrieving online users')
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleSubmitMessage = (e: FormEvent) => {
    e.preventDefault()
    const newMessage: IMessage = {
      text: message,
      sender: username,
      id: socket.id,
      timestamp: Date.now(),
      room
    }

    socket.emit('sendMessage', {message: newMessage, room})
    setChatHistory([...chatHistory, newMessage])
    setMessage('')
  }

  const handleRoomChange = (room: string) => {
    setRoom(room)
  }

  return (
    <Container fluid className='px-4'>
      <Row className='my-3' style={{ height: '95vh' }}>
      <Col md={2}>
          <ListGroup>
            {onlineUsers.length === 0 && <ListGroup.Item>No users yet</ListGroup.Item>}
            {onlineUsers.map((user) => (
              <ListGroup.Item key={user.id} onClick={() => handleRoomChange(user.username)}>{user.username}</ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
        <Col md={10} className='d-flex flex-column justify-content-between'>
          <Form onSubmit={submitUsername}>
            <FormControl
              placeholder='Insert here your username'
              value={username}
              onChange={(e: any) => setUsername(e.target.value)}
              disabled={loggedIn}
              size="lg"
            />
          </Form>
          <ListGroup>
            {chatHistory.map((message, i) => (
              <ListGroup.Item key={i}>
                <strong>{message.sender} - {message.room}</strong>
                <span className='mx-1'> | </span>
                <span>{message.text}</span>
                <span className='ml-2' style={{ fontSize: '0.7rem' }}>
                  {new Date(message.timestamp).toLocaleTimeString('en-US')}
                </span>
              </ListGroup.Item>
            ))}
          </ListGroup>
          <Form onSubmit={handleSubmitMessage}>
            <FormControl
              placeholder="What's your message?"
              value={message}
              onChange={(e: any) => setMessage(e.target.value)}
              disabled={!loggedIn}
              size="lg"
            />
          </Form>
        </Col>
      </Row>
    </Container>
  )
}

export default Home
