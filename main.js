
//let APP_ID = '441c933e820742d6abc40acf59268a74'
let APP_ID = '9621ca6de0b74d28b5a75005e8d6b859'
//let token ='007eJxTYFiUvLwvonRavFOpDvc/+ROTNN7e4vW0VOMU0/uyb1uQz3EFBhMTw2RLY+NUCyMDcxOjFLPEpGQTg8TkNFNLIzOLRHOTOw/LUxoCGRkmyh5hZmSAQBCfnyEgNbVIwTk/Ly81uSQzP4+BAQA6SiI/'
let uid = String(Math.floor(Math.random() * 232))
console.log('AppId', APP_ID)
//console.log('Token', token)
//console.log('uid', uid)

let token = null
let client
let channel

let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

if(!roomId) {
  window.location.href = 'lobby.html'
}

let localStream
let remoteStream
let peerConnection
//
const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
}

let constraints = {
  video: {
    width: { min: 640, ideal: 1920, max: 1920 },
    height: { min: 480, ideal: 1080, max: 1080 },
  },
  audio: true,
}

const init = async () => {
  client = await AgoraRTM.createInstance(APP_ID)
  await client.login({ uid,token })

  channel = client.createChannel(roomId)
  await channel.join()

  channel.on('MemberJoined', handleUserJoined)

  channel.on('MemberLeft', handleUserLeft)

  client.on('MessageFromPeer', handleMessageFromPeer)

  localStream = await navigator.mediaDevices.getUserMedia(constraints)
  document.getElementById('user-1').srcObject = localStream
  /*
  if ('srcObject' in document.getElementById('user-1')) {
    document.getElementById('user-1').srcObject = localStream
  } else {
    document.getElementById('user-1').src = URL.createObjectURL(localStream)
  }*/
}
let handleMessageFromPeer = async (message, MemberId) => {
  message = JSON.parse(message.text)

  if (message.type === 'offer') {
    createAnswer(MemberId, message.offer)
  }
  if (message.type === 'answer') {
    addAnswer(message.answer)
  }
  if (message.type === 'candidate') {
    if (peerConnection) {
      peerConnection.addIceCandidate(message.candidate)
    }
  }
}

let handleUserJoined = async (MemberId) => {
  window.alert('A new user joined the channel', MemberId)
  createOffer(MemberId)
}
let handleUserLeft = (MemberId) => {
  document.getElementById('user-2').style.display = 'none'
  document.getElementById('user-1').classList.remove('smallFrame')
}

const createPeerConnection = async (MemberId) => {
  peerConnection = new RTCPeerConnection(servers)

  remoteStream = new MediaStream()
  if ('srcObject' in document.getElementById('user-2')) {
    document.getElementById('user-2').srcObject = remoteStream
    document.getElementById('user-2').style.display = 'block'
    document.getElementById('user-1').classList.add('smallFrame')
  } else {
    document.getElementById('user-2').src = URL.createObjectURL(remoteStream)
    document.getElementById('user-2').style.display = 'block'
    document.getElementById('user-1').classList.add('smallFrame')
  }

  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia(constraints)
     document.getElementById('user-1').srcObject = localStream
     /*
    if ('srcObject' in document.getElementById('user-1')) {
      document.getElementById('user-1').srcObject = localStream
    } else {
      document.getElementById('user-1').src = URL.createObjectURL(localStream)
    }*/
  }

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream)
  })

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track)
    })
  }

  peerConnection.onicecandidate = async (e) => {
    if (e.candidate) {
      client.sendMessageToPeer(
        {
          text: JSON.stringify({ type: 'candidate', candidate: e.candidate }),
        },
        MemberId
      )
    }
  }
}

const createOffer = async (MemberId) => {
  await createPeerConnection(MemberId)

  let offer = await peerConnection.createOffer()
  await peerConnection.setLocalDescription(offer)

  client.sendMessageToPeer(
    { text: JSON.stringify({ type: 'offer', offer: offer }) },
    MemberId
  )
}

const createAnswer = async (MemberId) => {
  await createPeerConnection(MemberId)

  await peerConnection.setRemoteDescription(offer)

  let answer = await peerConnection.createAnswer()
  await peerConnection.setLocalDescription(answer)

  client.sendMessageToPeer(
    { text: JSON.stringify({ type: 'answer', answer: answer }) },
    MemberId
  )
}

const addAnswer = async (answer) => {
  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(answer)
  }
}

let toggleCamera = async () => {
  let videoTrack = localStream
    .getTracks()
    .find((track) => track.kind === 'video')

  if (videoTrack.enabled) {
    videoTrack.enabled = false
    document.getElementById('camera-btn').style.backgroundColor =
      'rgb(255, 80, 80)'
  } else {
    videoTrack.enabled = true
    document.getElementById('camera-btn').style.backgroundColor =
      'rgb(179, 102, 249, .9)'
  }
}

let toggleMic = async () => {
  let audioTrack = localStream
    .getTracks()
    .find((track) => track.kind === 'audio')

  if (audioTrack.enabled) {
    audioTrack.enabled = false
    document.getElementById('mic-btn').style.backgroundColor =
      'rgb(255, 80, 80)'
  } else {
    audioTrack.enabled = true
    document.getElementById('mic-btn').style.backgroundColor =
      'rgb(179, 102, 249, .9)'
  }
}

const leaveChannel = async () => {
  await channel.leave()
  await client.logout()
}

window.addEventListener('beforeunload', leaveChannel)

document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)

init()

/*
let APP_ID = '441c933e820742d6abc40acf59268a74'

let token =
  '007eJxTYDjKvFnc71BO45pvjfMf/Si5n//TTlGDUV345NE/C3j8T6opMJiYGCZbGhunWhgZmJsYpZglJiWbGCQmp5laGplZJJqbPL1fntIQyMigz5fFxMgAgSA+H0NAamqRc35eXmpySWZ+HgMDAMJhI1Y='
let uid = String(Math.floor(Math.random() * 10000))

let client
let channel

let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

if (!roomId) {
  window.location = 'lobby.html'
}

let localStream
let remoteStream
let peerConnection

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
}

let constraints = {
  video: {
    width: { min: 640, ideal: 1920, max: 1920 },
    height: { min: 480, ideal: 1080, max: 1080 },
  },
  audio: true,
}

let init = async () => {
  client = await AgoraRTM.createInstance(APP_ID)
  await client.login({ uid, token })

  channel = client.createChannel(roomId)
  await channel.join()

  channel.on('MemberJoined', handleUserJoined)
  channel.on('MemberLeft', handleUserLeft)

  client.on('MessageFromPeer', handleMessageFromPeer)

  localStream = await navigator.mediaDevices.getUserMedia(constraints)
  document.getElementById('user-1').srcObject = localStream
}

let handleUserLeft = (MemberId) => {
  document.getElementById('user-2').style.display = 'none'
  document.getElementById('user-1').classList.remove('smallFrame')
}

let handleMessageFromPeer = async (message, MemberId) => {
  message = JSON.parse(message.text)

  if (message.type === 'offer') {
    createAnswer(MemberId, message.offer)
  }

  if (message.type === 'answer') {
    addAnswer(message.answer)
  }

  if (message.type === 'candidate') {
    if (peerConnection) {
      peerConnection.addIceCandidate(message.candidate)
    }
  }
}

let handleUserJoined = async (MemberId) => {
  console.log('A new user joined the channel:', MemberId)
  createOffer(MemberId)
}

let createPeerConnection = async (MemberId) => {
  peerConnection = new RTCPeerConnection(servers)

  remoteStream = new MediaStream()
  document.getElementById('user-2').srcObject = remoteStream
  document.getElementById('user-2').style.display = 'block'

  document.getElementById('user-1').classList.add('smallFrame')

  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    })
    document.getElementById('user-1').srcObject = localStream
  }

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream)
  })

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track)
    })
  }

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      client.sendMessageToPeer(
        {
          text: JSON.stringify({
            type: 'candidate',
            candidate: event.candidate,
          }),
        },
        MemberId
      )
    }
  }
}

let createOffer = async (MemberId) => {
  await createPeerConnection(MemberId)

  let offer = await peerConnection.createOffer()
  await peerConnection.setLocalDescription(offer)

  client.sendMessageToPeer(
    { text: JSON.stringify({ type: 'offer', offer: offer }) },
    MemberId
  )
}

let createAnswer = async (MemberId, offer) => {
  await createPeerConnection(MemberId)

  await peerConnection.setRemoteDescription(offer)

  let answer = await peerConnection.createAnswer()
  await peerConnection.setLocalDescription(answer)

  client.sendMessageToPeer(
    { text: JSON.stringify({ type: 'answer', answer: answer }) },
    MemberId
  )
}

let addAnswer = async (answer) => {
  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(answer)
  }
}

let leaveChannel = async () => {
  await channel.leave()
  await client.logout()
}

let toggleCamera = async () => {
  let videoTrack = localStream
    .getTracks()
    .find((track) => track.kind === 'video')

  if (videoTrack.enabled) {
    videoTrack.enabled = false
    document.getElementById('camera-btn').style.backgroundColor =
      'rgb(255, 80, 80)'
  } else {
    videoTrack.enabled = true
    document.getElementById('camera-btn').style.backgroundColor =
      'rgb(179, 102, 249, .9)'
  }
}

let toggleMic = async () => {
  let audioTrack = localStream
    .getTracks()
    .find((track) => track.kind === 'audio')

  if (audioTrack.enabled) {
    audioTrack.enabled = false
    document.getElementById('mic-btn').style.backgroundColor =
      'rgb(255, 80, 80)'
  } else {
    audioTrack.enabled = true
    document.getElementById('mic-btn').style.backgroundColor =
      'rgb(179, 102, 249, .9)'
  }
}

window.addEventListener('beforeunload', leaveChannel)

document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)

init()*/