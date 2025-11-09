/*	A-Star Search.cpp
	Tool Used: Microsoft Visual Studio Community 2017 Version 15.8.6
	ITCS 6150 Intelligent Systems
	Project 1 - Solving 8 puzzle using A Star search algorithm
	Authors: Sravan Kumar Pothuraju
*/
#include "pch.h"
#include <iostream>
#include <stdlib.h>
#include <list>
#include <algorithm>
#include <chrono>
#include "Astarsearch.hpp"

using namespace std;

//Uncomment one & comment another MACRO to evaluate different heuristics
#define MISPLACED_TILES	1
//#define MANHATTAN			1

#define MAX_ROWS			3
#define MAX_COLUMNS			3

//fringe - Active states & closed - explored states
list<AStar> fringe, closed;
AStar startNode, currentNode, childNode;

//To keep track of number of nodes generated and Expanded
int nodesGenerated = 0;
int nodesExpanded = 0;

//Overloaded function < to compare total costs between nodes
bool AStar::operator<(const AStar &cur) const
{
	return (this->f <= cur.f);
}

//Overloaded function == used by isExplored fucntion
bool AStar::operator==(const AStar &cur) const
{
	for (int i = 0; i < MAX_ROWS; i++)
	{
		for (int j = 0; j < MAX_COLUMNS; j++)
		{
			if (this->a[i][j] != cur.a[i][j])
				return false;
		}
	}
	return true;
}

/*To Evaluate heuristic function, either Manhattan or Misplaced tiles*/
void AStar::getHeuristic()
{
	bool found;
	h = 0;

	// Manhattan distance Heuristic Evaluation
	#ifdef MANHATTAN
		for (i = 0; i < MAX_ROWS; i++) {
			for (j = 0; j < MAX_COLUMNS; j++) {
				found = false;
				for (auto k = 0; k < MAX_ROWS; k++) {
					for (auto l = 0; l < MAX_COLUMNS; l++) {
						if (a[i][j] == goal[k][l])
						{
							h += abs(i - k) + abs(j - l);
							found = true;
						}
						if (found)
							break;
					}
					if (found)
						break;
				}
			}
		}
	#endif // MANHATTAN

	// Misplaced Tiles Heuristic Evaluation
	#ifdef MISPLACED_TILES
		for (i = 0; i < MAX_ROWS; i++) {
			for (j = 0; j < MAX_COLUMNS; j++) {
				if (a[i][j] != goal[i][j]) {
					h++;
				}
			}
		}
	#endif //MISPLACED_TILES
}

/*set all the child node state functions*/
bool AStar::setChildState()
{
	nodesGenerated++;

	//If it is already explored, just ignore!!!
	if (!isExplored(childNode))
	{
		getTotalCost();						//Get the total cost
		fringe.push_back(childNode);		//Push it to the fringe
	}
	return false;
}

/*Get all the successor states of the current node*/
bool AStar::getSuccessors()
{
	bool isGoalReached = false;
	closed.push_back(currentNode);
	for (i = 0; i < MAX_ROWS; i++)
	{
		for (j = 0; j < MAX_COLUMNS; j++)
		{
			if (currentNode.a[i][j] == 0)
			{
				if (i > 0)
				{
					childNode			= currentNode;
					childNode.parent	= &(closed.back());
					swap(childNode.a[i][j], childNode.a[i-1][j]);
					if (setChildState())
					{
						isGoalReached = true;
						break;
					}
				}
				if (i < MAX_ROWS - 1)
				{
					childNode			= currentNode;
					childNode.parent	= &(closed.back());
					swap(childNode.a[i][j], childNode.a[i+1][j]);
					if (setChildState())
					{
						isGoalReached = true;
						break;
					}
				}
				if (j > 0)
				{
					childNode			= currentNode;
					childNode.parent	= &(closed.back());
					swap(childNode.a[i][j], childNode.a[i][j-1]);
					if (setChildState())
					{
						isGoalReached = true;
						break;
					}
				}
				if (j < MAX_COLUMNS - 1)
				{
					childNode			= currentNode;
					childNode.parent	= &(closed.back());
					swap(childNode.a[i][j], childNode.a[i][j+1]);
					if (setChildState())
					{
						isGoalReached = true;
						break;
					}
				}
			}
		}
		if (isGoalReached)
			break;
	}

	//Once done remove the current node from the fringe, as we don't need that anymore!!!
	fringe.remove(currentNode);
	return isGoalReached;
}

/*This method will evaluate total cost as f = g + h*/
void AStar::getTotalCost()
{
	childNode.g += 1;
	childNode.getHeuristic();
	childNode.f = childNode.g + childNode.h;
}

/*check whether the given node is in goal state*/
bool AStar::isGoal()
{
	for (auto i = 0; i < 3; i++)
		for (auto j = 0; j < 3; j++)
			if (a[i][j] != goal[i][j])
				return false;

	return true;
}

void AStar::solve()
{
	bool isGoalReached = false;
	currentNode = startNode;
	fringe.push_back(currentNode);

	while (true)
	{
		currentNode = fringe.front();
		for (auto it = fringe.begin(); it != fringe.end(); ++it)
		{
			//check if any other node in the fringe has fewer total cost than the current node
			//If yes, then assign it as the current node
			if (*it < currentNode)
				currentNode = *it;
		}

		//check if current node is the goal state
		if (currentNode.isGoal())
		{
			nodesExpanded = closed.size();
			printPath(&currentNode);
			return;
		}
		else
		{
			isGoalReached = getSuccessors();
		}

		if (isGoalReached)
			break;
	}
	return;
}

/*This method is to print the output 2D array*/
void AStar::print()
{
	for (i = 0; i < MAX_ROWS; i++)
	{
		for (j = 0; j < MAX_COLUMNS; j++)
		{
			cout << a[i][j] << " ";
		}
		cout << endl;
	}
	cout << endl;
}

/*This method reccursively calls all its parents*/
void AStar::printPath(AStar *cur)
{
	if (cur != NULL)
	{
		printPath((*cur).parent);
		(*cur).print();
	}
}

/*isExplored function will check whether the given node is already explored or not*/
bool AStar::isExplored(AStar &cur)
{
	for (auto it = closed.begin(); it != closed.end(); ++it)
	{
		if ((*it) == cur)
			return true;
	}
	return false;
}

int main()
{
	cout << "Enter the Initial state\n";
	for (int i = 0; i < 3; i++)
	{
		for (int j = 0; j < 3; j++)
		{
			cin >> startNode.a[i][j];
		}
	}

	cout << "Enter the goal state\n";
	for (int i = 0; i < 3; i++)
	{
		for (int j = 0; j < 3; j++)
		{
			cin >> startNode.goal[i][j];
		}
	}

	cout << "*****************Best Path*****************" << endl;

	//Initial cost
	startNode.g = 0;
	startNode.getHeuristic();
	startNode.f = startNode.g + startNode.h;

	//starting node won't have parent
	startNode.parent = NULL;
	startNode.solve();

	cout << "Number of nodes generated: " << nodesGenerated << endl;
	cout << "Number of nodes expanded: " << nodesExpanded << endl;
}
