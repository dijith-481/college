# A. Problem Definition

## Project Title

**Traffic Signal Timing Optimization Using Queuing Theory and Monte Carlo Simulation**

## Problem Statement

An isolated four-way junction has a fixed signal cycle shared by four incoming approaches: North, East, South, and West. Each approach needs green time to serve vehicles, but the total green time available in a cycle is limited. Giving more green time to one approach leaves less for the others. Vehicles arrive at uncertain times, so the consequences of a timing plan cannot be judged reliably from a single traffic run.

The decision problem is to select the duration of each approach's green phase, subject to the cycle length, clearance time, permitted green-time bounds, and chosen timing step. The selected plan should minimize **expected total time spent waiting in the modeled queues** during a fixed operating period. The project estimates that expectation by simulating many arrival scenarios for every feasible timing on the selected grid, then assesses the chosen timing on fresh scenarios against the user's input timing, equal-green timing, and a demand-proportional timing.

## Real-World Context

At a signalized junction, traffic demand can differ by direction and fluctuate from moment to moment. A fixed equal split of green time may give too much capacity to a quiet approach while a busier approach develops a queue. A timing based only on average demand can also face temporary backlogs when vehicles arrive in bursts. Signal timing is therefore an allocation decision under uncertainty.

The implemented case represents one isolated junction with three dedicated incoming lanes per approach: left turn, straight ahead, and right turn. Four protected phases serve the approaches in a fixed sequence, one approach at a time. The operating period starts with empty queues. Arrival rates and turning probabilities are configurable inputs; the project does not claim that its default values were measured at a particular location. Its vehicle animation illustrates the modeled event history rather than reproducing physical vehicle motion.

## Significance of the Problem

The study makes the trade-off in signal timing measurable. Total queued waiting, reported in vehicle-seconds, accounts for every vehicle affected by a timing decision, including vehicles still waiting when the operating period ends. Queue lengths, completed throughput, and residual backlog add context to that primary measure. Repeating the experiment over random arrival scenarios shows how much the outcome can vary and how uncertain a comparison remains.

The project provides a reproducible way to compare feasible signal plans and explain why one plan is recommended under the stated assumptions. It applies the syllabus topics of queue characteristics, Poisson arrivals, random-number generation, and queueing simulation to an OR decision problem. The resulting timing is an estimated optimum **within the tested timing grid and simulation model**; applying it to a real junction would require local traffic measurements and validation.
