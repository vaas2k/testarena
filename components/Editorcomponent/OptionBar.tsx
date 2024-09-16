import {
  AlertDialog,
  Badge,
  Button,
  ChevronDownIcon,
  Flex,
} from "@radix-ui/themes";
import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { showCard } from "@/storeRedux/reducers/winCard";
import { ontimeoutwin,onsubmissionwin,ondraw, marathonMatchOver, abandonMatch } from "@/BACKEND_CALLs/apis";
import { updateProblems } from "@/storeRedux/reducers/marathonReducer";
import { emptyTestCases } from "@/storeRedux/reducers/testCasesReducer";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const OptionBar = ({
  player2,
  currentplayer,
  P2PassedCases,
  matchInfo,
  code,
}: any) => {

  const requestInProgress = useRef(false);
  const timeLeftRef = useRef(1200);
  const [ ,setTimeLeft] = useState(1200); // 20 minutes in seconds
  const P1PassedCases = useSelector((state: any) => {
    return state.testCasesReducer.passed;
  });
  const totalTestCases = useSelector(( state : any ) => { return state.testCasesReducer.total});
  const win = useSelector((state : any) => { return state.winCard.showCard }) ;


  const dispatch = useDispatch();

  // time control functionality   
  useEffect(() => {
    const timer = setInterval(() => {
      if (timeLeftRef.current > 0) {
        timeLeftRef.current -= 1;
        setTimeLeft(timeLeftRef.current); // Trigger a re-render every second
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer); // Cleanup the interval on component unmount
  }, []);
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")} : ${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // win control functionality
  useEffect(() => {
    const TimeOut = async (winner: any, loser: any) => {
      if (requestInProgress.current) return; // Prevent multiple requests
      requestInProgress.current = true;
      try {
        const data = {
          from: currentplayer.username,
          id: matchInfo.id,
          room_id: matchInfo.room_id,
          winner: {
            id: winner.id,
            username: winner.username,
            by: "timeout",
            casesPassed: winner.id == currentplayer.id ? P1PassedCases : P2PassedCases,
            rating : winner.rating 
          },
          loser: {
            id: loser.id,
            username: loser.username,
            casesPassed: loser.id === currentplayer.id ? P1PassedCases : P2PassedCases,
            rating : loser.rating
          },
        };
        // send req to backend for processing data
        const req = await ontimeoutwin(data);
        if (req.status === 200) {
          dispatch(
            showCard({
              winner: winner.username,
              soluton: "NO SOLUTION",
              winnerImage:
                winner.id === currentplayer.id ? currentplayer.image : player2.image,
              showCard: true,
              by: "timeout",
              loser: loser.username,
              loserImage: winner.id === currentplayer.id ? player2.image : currentplayer.image,
              rating : winner.id === currentplayer.id ? req.data.winner.rating : req.data.loser.rating
            })
          );
          
        }
      } catch (error) {
        console.log(error);
      } finally {
        requestInProgress.current = false;
      }
    };

    const onDraw = async () => {
      if (requestInProgress.current) return; // Prevent multiple requests
      requestInProgress.current = true;
      try {
        const data = {
          from: currentplayer.username,
          id: matchInfo.id,
          room_id: matchInfo.room_id,
        };
        const req = await ondraw(data);
        if (req.status === 200) {
          dispatch(
            showCard({
              winner: currentplayer.username,
              soluton: "good for now",
              winnerImage: currentplayer.image,
              showCard: true,
              by: "draw",
              loserImage: player2.image,
              loser: player2.username,
              rating : currentplayer.rating 
            })
          );
        }
      } catch (error) {
        console.log(error);
      } finally {
        requestInProgress.current = false;
      }
    };

    if (timeLeftRef.current === 0 && !win) {
      // call when times end
      if (P1PassedCases > P2PassedCases) {
        TimeOut(currentplayer, player2);
      } else if (P2PassedCases > P1PassedCases) {
        TimeOut(player2, currentplayer);
      } else if (P1PassedCases === P2PassedCases) {
        onDraw();
      }
      setTimeLeft(0);
      timeLeftRef.current = 0;
    }

 
      
  }, [ timeLeftRef.current,matchInfo ]);


  // Submission Win Control
  useEffect(() => {
    const submissionWin = async (winner: any, loser: any)  => {

      if(requestInProgress.current) return;
      requestInProgress.current = true;
      try {

        const data = {
          ...matchInfo,
          from: currentplayer.username,
          winner: { id: winner.id, username: winner.username, by: "solving" , code : winner.code, rating : winner.rating },
          loser: { id: loser.id, username: loser.username , rating : loser.rating},
          by : 'solving'
        };

        const req: any = await onsubmissionwin(data);
        if (req.status === 200) {

          dispatch(
            showCard({
              winner: winner.username,
              solution: req.data.winner.solution,
              winnerImage: winner.image,
              showCard: true,
              by: "solving",
              loser: req.data.loser.username,
              loserImage: loser.image,
              rating : winner.id === currentplayer.id ? req.data.winner.rating : req.data.loser.rating
            })
          );
          setTimeLeft(0);
          timeLeftRef.current = 0;
        }
      } catch (error) {
        console.log(error);
      } finally { 
        requestInProgress.current = false;
      }
    };
    // call submission win for P1 (arg1 winner, arg2 loser)
    if (matchInfo.totalCases > 0 && matchInfo.totalCases === P1PassedCases) {
      submissionWin({...currentplayer,code}, player2);
    }
    // call submission win for P2 (arg1 winner, arg2 loser)
    if (matchInfo.totalCases > 0 && matchInfo.totalCases === P2PassedCases) {
      submissionWin(player2, {...currentplayer,code});
    }
  },[P1PassedCases,P2PassedCases,totalTestCases])


  // resign or abandon
  async function abandon_match() {
    try {
      if (!player2.username || !player2.image) {
        console.error("Player 2 data is missing:", player2);
        return;
      }
      if (win) {
        console.log('Match Already Over');
        return;
      }
  
      const winner = { username: player2.username, image: player2.image, rating: player2.rating };
      const loser = { username : currentplayer.username, image: currentplayer.image, rating: currentplayer.rating };
      const data = {
        ...matchInfo,
        winner: winner,
        loser: loser,
        by: 'resign'
      };
  
      const req = await abandonMatch(data);
      if (req.status === 200) {
        console.log('Good job, request sent successfully');
        dispatch(
          showCard({
            winner: data.winner.username,
            solution: 'NO SOLUTION',
            winnerImage: data.winner.image,
            showCard: true,
            by: data.by,
            loser: data.loser.username,
            loserImage: data.loser.image,
            rating : data.winner.username == currentplayer.username ? data.winner.rating :  data.loser.rating
          })
        );
      } else {
        console.error('Failed to send request:', req);
      }
    } catch (error) {
      console.error('Error in abandon_match:', error);
    }
  } 
  
  return (
    <div className="flex items-center justify-between border dark:bg-neutral-900 bg-white rounded-lg w-[100%] h-[40px] p-[10px]">
      <div className="flex items-center justify-center gap-[20px]">
        <img
          src={player2.image}
          className="w-[30px] h-[30px] rounded-full object-cover"
        />
        <Badge>
          {player2.username} &nbsp; {player2.rating}
        </Badge>
        <Badge color={"ruby"}>Cases Passed - {P2PassedCases} / {matchInfo.totalCases}</Badge>
      </div>

      {/** will change time color based on time left */}
      <Badge color={timeLeftRef.current == 600 ? "red" : "ruby"} size={"3"}>
        {formatTime(timeLeftRef.current)}
      </Badge>

      <div className="flex items-center justify-center gap-[20px]">
        <AlertDialog.Root>
          <AlertDialog.Trigger>
            <Button color="ruby" variant="ghost" className="flex gap-[5px]">
              <p>options</p> <ChevronDownIcon />
            </Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content maxWidth="450px">
            <AlertDialog.Title>Match Options</AlertDialog.Title>

            <Flex className="flex-col gap-[10px]">
              <AlertDialog.Action>
                <Button color="red" onClick={() => {abandon_match()}}>Resign / Abort</Button>
              </AlertDialog.Action>
              <AlertDialog.Action>
                <Button color="blue">cancel</Button>
              </AlertDialog.Action>
            </Flex>
          </AlertDialog.Content>
        </AlertDialog.Root>
        <Badge>
          {currentplayer.username} &nbsp; {currentplayer.rating}
        </Badge>
        <img
          src={currentplayer.image}
          className="w-[30px] h-[30px] rounded-full object-cover"
        />
      </div>
    </div>
  );
};

const OptionBarMarathon = ({ currentplayer , handleMarathonCard }: any) => {

  // State Definitions
  const requestProgress = useRef(false);
  const timeLeftRef = useRef(1200);
  const [,setTimeLeft] = useState(1200); // 20 minutes in seconds
  const cases = useSelector(( state : any ) => { return state.testCasesReducer});
  const matchData = useSelector((state : any) => { return  state.marathonReducer} );
  const [solved , setSolved ] = useState<number>(0); 

  // Hooks Definition
  const dispatch = useDispatch() ;
  const router = useRouter();

  // time control functionality
  useEffect(() => {
    const timer = setInterval(() => {
      if (timeLeftRef.current > 0) {
        timeLeftRef.current -= 1;
        setTimeLeft(timeLeftRef.current); // Trigger a re-render every second
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer); // Cleanup the interval on component unmount
  }, []);
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")} : ${seconds
      .toString()
      .padStart(2, "0")}`;
  };



  useEffect(() => {
  
      async function matchOver () {
        if(requestProgress.current) return;
        requestProgress.current = true;
        try {
          const req : any = await marathonMatchOver({...matchData,solved : solved,username : currentplayer.username, image : currentplayer.image, rating  : currentplayer.rating});
          if(req.status === 200) {
            handleMarathonCard(true);
          }

        } catch(error) {
          console.log(error);
        } finally { 
          requestProgress.current = false;
        }
      }

      if(timeLeftRef.current == 0) {
        // make a call to save in db + update ranking in leaderboard
        matchOver();
        setTimeLeft(0);
        timeLeftRef.current = 0;
      }

    if (cases.passed > 0 && cases.total == cases.passed) {
      const lastProblem = matchData.problems[matchData.problems.length - 1];
      console.log(`Problem Solved: ${lastProblem}`);
      
      toast('Accepted', {
        icon: '👏',
        position :'top-center',
        style : {
          color : 'lightgren',
          backgroundColor:'gray'
        }
      });

      while (true) {
        const id = Math.floor(Math.random() * 73) + 1;
        if(id == 53 || id == 54) continue;
        const newProblem = matchData.problems.find((problem : number) => problem === id);
        if (!newProblem) {
          dispatch(updateProblems(id));
          break;
        }
      dispatch(emptyTestCases());
      setSolved(solved + 1);
      }
    }

  },[ timeLeftRef.current , cases.total, cases.passed]);


  return (
    <div className="flex items-center justify-between border dark:bg-neutral-900 bg-white rounded-lg w-[100%] h-[40px] p-[10px]">
      {/** will change time color based on time left */}
      <Badge>{formatTime(timeLeftRef.current)}</Badge>

      <div className="flex items-center justify-center gap-[20px]">
        <AlertDialog.Root>
          <AlertDialog.Trigger>
            <Button color="ruby" variant="ghost" className="flex gap-[5px]">
              <p>options</p> <ChevronDownIcon />
            </Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content maxWidth="450px">
            <AlertDialog.Title>Match Options</AlertDialog.Title>

            <Flex className="flex-col gap-[10px]">
              <AlertDialog.Action>
                <Button color="red">Forfeit</Button>
              </AlertDialog.Action>
              <AlertDialog.Action>
                <Button color="blue">cancel</Button>
              </AlertDialog.Action>
            </Flex>
          </AlertDialog.Content>
        </AlertDialog.Root>
        <Badge>
          {currentplayer.username} &nbsp; {currentplayer.rating}
        </Badge>
        <img
          src={currentplayer.image}
          className="w-[30px] h-[30px] rounded-full object-cover"
        />
      </div>
    </div>
  );
};

export { OptionBar, OptionBarMarathon };


  function showReducerCard(arg0: { winner: any; solution: string; winnerImage: any; showCard: boolean; by: any; loser: any; loserImage: any; }): any {
    throw new Error("Function not implemented.");
  }
/** options for duo matches
 * <div className="flex items-center justify-center gap-[20px]">
        <Button variant="ghost" color="ruby">
          <ChatBubbleIcon />
        </Button>
        <Button variant="ghost" color="ruby">
          <PersonIcon />
        </Button>
        <Button variant="ghost" color="ruby">
          <SpeakerOffIcon />
        </Button>
      </div>
 */
