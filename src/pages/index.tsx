import { Card } from '@/components/Card';
import { Meta } from '@/layouts/Meta';
import { Main } from '@/templates/Main';

const Index = () => {
  return (
    <Main
      meta={
        <Meta title="💰Money Spending" description="Money Spending Board." />
      }
    >
      <div className="flex flex-row-reverse">
        <div className="pb-3">สรุปประจำเดือน {`{}`} บาท</div>
      </div>
      <Card className="h-96">
        <div className="flex h-full">
          <div className="mr-1 h-full w-1/2 border-2 bg-pink-300 p-1">
            <span className="font-semibold text-black">ความจำเป็น 50%</span>
            <div className="h-90% overflow-y-auto pb-3">
              {[
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
                19, 20,
              ].map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
          </div>
          <div className="ml-1 flex h-full w-1/2 flex-col">
            <div className="mb-1 h-2/5 w-full border-2 bg-green-300 p-1">
              <div className="h-5/6 flex-row">
                <div className="font-semibold text-black">ออม 20%</div>
                <div className="h-5/6 overflow-y-auto">
                  {[
                    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
                    18, 19, 20,
                  ].map((item) => (
                    <div key={item}>{item}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-1 h-3/5 w-full border-2 bg-amber-300 p-1">
              <span className="font-semibold text-black">ความต้องการ 30%</span>
              <div className="h-5/6 overflow-y-auto pb-3">
                {[
                  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
                  19, 20,
                ].map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Main>
  );
};

export default Index;
