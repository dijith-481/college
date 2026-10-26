- hosts or end systems the devices connected to the network
- packets split up the data and add the headers and uses a packet switching network like interconnection of roads
- end system access the internet through the ISPs
- low level ISPs form networks with upper tier ISPs
- each ISP is managed independently
- TCP and IP
- internet standards developed by the internet engineering task force through RFCs
- internet connected distributed systems
- guided vs unguided(fibre vs air)
- full transmission rate = F=L/R L= bits in a packet, R = bits per second,
- total delay =2L/R with 1 switch - store and forward
- time to send 3 packets = 4L/R
- if N routers in between then time to send N-1 packet = NL/R

## timing delays

- processing dealy - time to process the header and to determine where to send the packet
- queueing delay - time to add the packet to the queue
- transmission delay - L/R time required to push the packet to a link
- propagation delay - time for the packet to travel from one link to another
- average queueing delay on L/R is exponential
