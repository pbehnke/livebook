package fellowship

// user may have multiple sessions [split screen]
// messages are sent to a session not a user
// agressivly time sessions out - potentially bring them back if needed

// TODO

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"
)

type Member struct {
	name        string
	updated_on  int64
	created_on  int64
	messages    map[Session][]string
	reply_queue []func()
}

type Group string
type Session string

type Fellowship struct {
	Members  map[Group]map[Session]*Member
	putChan  chan put
	getChan  chan get
}

type get struct {
	group Group
	session Session
	name string
	reply chan *FellowshipUpdate
}

type put struct {
	group Group
	from Session
	to Session
	message string
}

type FellowshipUpdate struct {
	Session   Session
	Members   []Session
	Messages  map[Session][]string
}

func New() *Fellowship {
	f := &Fellowship{}
	f.Init()
	return f
}

func (f *Fellowship) Init() {
	f.Members = map[Group]map[Session]*Member{}
	f.getChan = make(chan get)
	f.putChan = make(chan put)
	go f.handler()
}

func (f *Fellowship) handler() {
	for {
		select {
			case get := <-f.getChan:
				f.handleGet(get);
			case put := <-f.putChan:
				f.handlePut(put);
		}
	}
}

func (f *Fellowship) Put(group string, from string, to string, message string) {
	f.putChan <- put{group: Group(group), from: Session(from), to: Session(to), message: message }
}

func (f *Fellowship) handlePut(put put) {
	fmt.Printf("handle put %v\n",put)

	//From,fok := f.Members[group][from]
	To,tok   := f.Members[put.group][put.to]

	// TODO also check for the dead flag

	if !tok {
		fmt.Printf("Session mismatch - must be an out of date message u=%s s=%s\n",put.from,put.to)
		return
	}

	To.messages[put.from] = append(To.messages[put.from], put.message)

	if len(To.reply_queue) > 0 {
		reply := To.reply_queue[0]
		To.reply_queue = To.reply_queue[1:]
		reply()
	}
}

func (f *Fellowship) Get(group string, name string, session string) *FellowshipUpdate {
	get := get{group: Group(group), name: name, session: Session(session), reply: make(chan *FellowshipUpdate)}
	f.getChan <- get
	return <-get.reply
}

func (f *Fellowship) handleGet(get get) {
	fmt.Printf("handle get %v\n",get)
	group := get.group
	name := get.name
	session := get.session

	var last int64 = 0
	now := time.Now().Unix()

	if f.Members[group] == nil {
		f.Members[group] = map[Session]*Member{}
	}

	if session == "" || f.Members[group][session] == nil { // begin a new session
		session = Session(randomString(6))
		f.Members[group][session] = &Member{name: name, created_on: now, messages: map[Session][]string{}}
	} else {
		last = f.Members[group][session].updated_on
	}

	f.Members[group][session].updated_on = now

	member := f.Members[group][session]

	fmt.Printf("GET 1\n")

	reply := func() {
		update := &FellowshipUpdate{Members: []Session{}, Messages: member.messages, Session: session}
		member.messages = map[Session][]string{}

		for k := range f.Members[group] {
			if k != session && f.Members[group][k].created_on >= last {
				update.Members = append(update.Members, k)
			}
		}

		fmt.Printf("GET 3\n")
		get.reply <-update
	}

	if (len(member.messages) > 0 || get.session == "") {
		fmt.Printf("GET 2a\n")
		reply()
	} else {
		fmt.Printf("GET 2b\n")
		member.reply_queue = append(member.reply_queue,reply)
	}
}

func randomString(length int) (str string) {
	b := make([]byte, length)
	rand.Read(b)
	return base64.StdEncoding.EncodeToString(b)
}

